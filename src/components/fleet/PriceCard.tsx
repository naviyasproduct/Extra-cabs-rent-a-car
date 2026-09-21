import Link from "next/link";
import { ArrowRight, MessageCircle, Phone } from "lucide-react";
import type { Car } from "@/types";
import { site } from "@/lib/data/site";
import { KM_PER_DAY, RATE_TIERS, tierTotal } from "@/lib/pricing";
import { cn, formatNumber, formatPrice } from "@/lib/utils";

/**
 * Booking card on the vehicle page: the daily rate, then the long-hire rate
 * table the staff set in the panel. Every figure is read from the fleet data,
 * and each total is worked out from its per-day rate, so the two columns
 * cannot disagree.
 */
export function PriceCard({ car }: { car: Car }) {
  return (
    <div className="lg:sticky lg:top-28">
      <div className="p-6 lg:p-7">
        <div>
          <p className="font-display text-4xl font-extrabold leading-none">
            {formatPrice(car.pricing.daily)}
          </p>
          <p className="mt-2 text-sm text-muted">per day</p>
        </div>

        {/* Longer hires */}
        <table className="mt-6 w-full border-collapse text-sm">
          <caption className="mb-3 text-left font-display text-sm font-bold uppercase tracking-[0.14em]">
            Longer hires cost less
          </caption>
          <thead>
            <tr>
              <th scope="col" className="border-b border-line pb-2 text-left text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                Hire for
              </th>
              <th scope="col" className="border-b border-line pb-2 text-right text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                Per day
              </th>
              <th scope="col" className="border-b border-line pb-2 text-right text-xs font-semibold uppercase tracking-[0.1em] text-muted">
                Total
              </th>
            </tr>
          </thead>
          <tbody>
            {RATE_TIERS.map((tier) => {
              const perDay = car.pricing.tiers[tier.id];
              return (
                <tr key={tier.id} className="border-b border-line">
                  <th scope="row" className="py-2.5 pr-2 text-left align-top font-semibold">
                    {tier.label}
                  </th>
                  <td className="py-2.5 pr-2 text-right align-top tabular-nums text-ink-soft">
                    {formatNumber(perDay)}
                  </td>
                  <td className="py-2.5 text-right align-top tabular-nums">
                    <span className="font-semibold">{formatNumber(tierTotal(perDay, tier))}</span>
                    {tier.perMonth ? (
                      <span className="block text-[0.6875rem] uppercase tracking-[0.08em] text-muted">
                        per month
                      </span>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-muted">
          All rates in LKR. A hire is charged at the rate for its length.
        </p>

        <div className="mt-6 h-px bg-line" />

        <dl className="mt-6 space-y-3 text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">Kilometres included</dt>
            <dd className="font-semibold">{KM_PER_DAY} km / day</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">Each extra km</dt>
            {/* No rate set yet is said plainly, never filled with a guess. */}
            <dd className="font-semibold">
              {car.pricing.extraKm ? formatPrice(car.pricing.extraKm) : "Ask us"}
            </dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            {/* "Security", not "refundable": it comes back less deductions,
                and the rent beside it is not refundable at all. */}
            <dt className="text-muted">Security deposit</dt>
            <dd className="font-semibold">{formatPrice(car.pricing.deposit)}</dd>
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <dt className="text-muted">With a driver</dt>
            <dd className="font-semibold">
              {car.pricing.withDriverDaily
                ? `${formatPrice(car.pricing.withDriverDaily)} / day`
                : "Self-drive only"}
            </dd>
          </div>
        </dl>

        <Link
          href={`/booking?car=${car.slug}`}
          className={cn(
            "mt-7 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full font-semibold transition-colors duration-200",
            car.available
              ? "bg-brand text-white hover:bg-brand-hover"
              : "pointer-events-none bg-field text-muted",
          )}
          aria-disabled={!car.available}
        >
          {car.available ? "Book this vehicle" : "Currently on hire"}
          {car.available ? <ArrowRight className="size-4" aria-hidden /> : null}
        </Link>
      </div>

      {/* Contact strip. These are controls, so they take --color-field: on a
         flat black page a button with no fill and no border is invisible, which
         is what bg-surface (transparent) left them as. Pill shape and the
         inverted icon badge are the same language as <Button arrow>, so they
         read as the secondary pair under the primary CTA. */}
      <div className="mt-(--gap) grid grid-cols-2 gap-3">
        <a
          href={`tel:${site.phone.replace(/\s/g, "")}`}
          className="group/contact inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-field pr-5 pl-2 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-field-hover"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white transition-colors duration-200 group-hover/contact:bg-brand-hover">
            <Phone className="size-4" aria-hidden />
          </span>
          Call
        </a>
        <a
          href={`https://wa.me/${site.whatsapp.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noreferrer"
          className="group/contact inline-flex h-14 items-center justify-center gap-2.5 rounded-full bg-field pr-5 pl-2 text-sm font-semibold text-ink transition-colors duration-200 hover:bg-field-hover"
        >
          <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-white transition-colors duration-200 group-hover/contact:bg-brand-hover">
            <MessageCircle className="size-4" aria-hidden />
          </span>
          WhatsApp
        </a>
      </div>
    </div>
  );
}
