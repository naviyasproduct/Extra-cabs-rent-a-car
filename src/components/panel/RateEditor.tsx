"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import type { RateTierId, RateTiers } from "@/types";
import {
  RATE_TIERS,
  discountPercent,
  suggestedRate,
  tierTotal,
} from "@/lib/pricing";
import { tierField } from "@/lib/panel/vehicle-form";
import { cn, formatNumber } from "@/lib/utils";

type Row = { value: string; manual: boolean };

/**
 * The daily rate plus the long-hire rate table, as a vehicle form sees it.
 *
 * Typing a daily rate fills every tier nobody has touched with a suggested
 * rate. A tier typed into by hand is marked "Edited" and left alone after
 * that, so a later change to the daily rate never silently overwrites a
 * deliberate price. "Recalculate" hands every tier back to the suggestion.
 *
 * Plain named inputs, no hidden state: the server action reads `daily` and
 * `tier_<id>` and does not care that this is a client component. Inside a
 * disabled fieldset every control here is disabled with it.
 */
export function RateEditor({
  initialDaily,
  initialTiers,
}: {
  initialDaily?: number;
  initialTiers?: RateTiers;
}) {
  const [daily, setDaily] = useState(initialDaily ? String(initialDaily) : "");

  // On an existing vehicle a tier that differs from the suggestion was set on
  // purpose, so it starts as edited and a daily change will not move it.
  const [rows, setRows] = useState<Record<RateTierId, Row>>(() => {
    const out = {} as Record<RateTierId, Row>;
    for (const tier of RATE_TIERS) {
      const saved = initialTiers?.[tier.id];
      out[tier.id] =
        saved === undefined
          ? { value: "", manual: false }
          : {
              value: String(saved),
              manual: saved !== suggestedRate(initialDaily ?? 0, tier),
            };
    }
    return out;
  });

  const dailyNumber = Number(daily);
  const hasDaily = daily.trim() !== "" && dailyNumber > 0;

  const changeDaily = (value: string) => {
    setDaily(value);
    const parsed = Number(value);
    setRows((current) => {
      const next = { ...current };
      for (const tier of RATE_TIERS) {
        if (next[tier.id].manual) continue;
        next[tier.id] = {
          value: parsed > 0 ? String(suggestedRate(parsed, tier)) : "",
          manual: false,
        };
      }
      return next;
    });
  };

  const changeTier = (id: RateTierId, value: string) =>
    setRows((current) => ({ ...current, [id]: { value, manual: value.trim() !== "" } }));

  const recalculate = () =>
    setRows(() => {
      const out = {} as Record<RateTierId, Row>;
      for (const tier of RATE_TIERS) {
        out[tier.id] = {
          value: hasDaily ? String(suggestedRate(dailyNumber, tier)) : "",
          manual: false,
        };
      }
      return out;
    });

  const anyManual = RATE_TIERS.some((tier) => rows[tier.id].manual);

  return (
    <div className="flex flex-col gap-4">
      <label className="flex max-w-[16rem] flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.12em] text-muted">
          One day rate LKR
        </span>
        <input
          name="daily"
          type="number"
          min={0}
          step={50}
          inputMode="numeric"
          value={daily}
          onChange={(event) => changeDaily(event.target.value)}
          placeholder="9500"
          className="h-11 bg-field px-3 text-sm text-ink tabular-nums placeholder:text-muted/70 disabled:opacity-50"
        />
        <span className="text-xs text-muted">
          The table below fills itself from this. Change any row to set your own.
        </span>
      </label>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[22rem] border-collapse text-sm">
          <thead>
            <tr className="text-left">
              <th className="border-b border-line pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Hire for
              </th>
              <th className="border-b border-line pb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Per day rate
              </th>
              <th className="border-b border-line pb-2 text-right text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {RATE_TIERS.map((tier) => {
              const row = rows[tier.id];
              const perDay = Number(row.value);
              const valid = row.value.trim() !== "" && perDay > 0;
              const off = hasDaily && valid ? discountPercent(dailyNumber, perDay) : null;

              return (
                <tr key={tier.id} className="border-b border-line-strong/30">
                  <td className="py-2.5 pr-3 align-middle">
                    <span className="font-semibold text-ink">{tier.label}</span>
                    <span className="mt-0.5 block text-xs text-muted">
                      {row.manual ? (
                        <span className="text-brand-bright">Edited</span>
                      ) : (
                        "Auto"
                      )}
                      {off !== null && off > 0 ? ` · ${off}% off daily` : ""}
                    </span>
                  </td>
                  <td className="py-2.5 pr-3 align-middle">
                    <input
                      name={tierField(tier.id)}
                      type="number"
                      min={0}
                      step={50}
                      inputMode="numeric"
                      aria-label={`Per day rate for ${tier.label}, LKR`}
                      value={row.value}
                      onChange={(event) => changeTier(tier.id, event.target.value)}
                      placeholder={hasDaily ? String(suggestedRate(dailyNumber, tier)) : "Auto"}
                      className={cn(
                        "h-10 w-full max-w-[9rem] bg-field px-3 text-sm tabular-nums placeholder:text-muted/70 disabled:opacity-50",
                        row.manual ? "text-brand-bright" : "text-ink",
                      )}
                    />
                  </td>
                  <td className="py-2.5 text-right align-middle tabular-nums">
                    <span className="font-semibold text-ink">
                      {valid ? formatNumber(tierTotal(perDay, tier)) : "-"}
                    </span>
                    {tier.perMonth ? (
                      <span className="mt-0.5 block text-[0.6875rem] uppercase tracking-[0.08em] text-muted">
                        per month
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={recalculate}
          disabled={!hasDaily || !anyManual}
          className="inline-flex items-center gap-1.5 rounded-full bg-field px-3.5 py-2 text-xs font-semibold transition-colors hover:bg-field-hover disabled:opacity-40"
        >
          <RotateCcw className="size-3.5" aria-hidden />
          Recalculate from the daily rate
        </button>
        <span className="text-xs text-muted">
          A box left empty is saved as the suggested rate.
        </span>
      </div>
    </div>
  );
}
