import type { CarPricing, RateTierId, RateTiers } from "@/types";

/**
 * Longer hires, cheaper days.
 *
 * Every vehicle carries a per-day rate for each of these durations. The total
 * is never stored: it is always the per-day rate times the tier's billing
 * days, so the two columns of the rate table cannot disagree.
 *
 * PURE and client-safe: no store, no node built-ins, no fleet data. The panel's
 * rate editor, the public price card and the booking estimate all import it.
 */

export interface RateTier {
  id: RateTierId;
  label: string;
  /** Shortest hire, in days, that earns this rate. */
  minDays: number;
  /**
   * Days one "Total" figure covers. A week tier shows the whole hire; a month
   * tier shows one month, since a six month total is not a useful number.
   */
  billedDays: number;
  perMonth: boolean;
  /** Suggested discount off the daily rate, used when nothing was typed. */
  discount: number;
}

export const RATE_TIERS: readonly RateTier[] = [
  { id: "week1", label: "1 week", minDays: 7, billedDays: 7, perMonth: false, discount: 0.1 },
  { id: "week2", label: "2 weeks", minDays: 14, billedDays: 14, perMonth: false, discount: 0.15 },
  { id: "week3", label: "3 weeks", minDays: 21, billedDays: 21, perMonth: false, discount: 0.2 },
  { id: "month1", label: "1 month", minDays: 30, billedDays: 30, perMonth: true, discount: 0.3 },
  { id: "month3", label: "3 months", minDays: 90, billedDays: 30, perMonth: true, discount: 0.35 },
  { id: "month6", label: "6 months and over", minDays: 180, billedDays: 30, perMonth: true, discount: 0.4 },
];

/** Rates end in 00 or 50, the way the agency quotes them. */
function roundRate(value: number): number {
  return Math.max(0, Math.round(value / 50) * 50);
}

/** The per-day rate a tier gets when nobody has typed one. */
export function suggestedRate(daily: number, tier: RateTier): number {
  return roundRate(daily * (1 - tier.discount));
}

/** A full set of suggested rates for one daily price. */
export function suggestedTiers(daily: number): RateTiers {
  return Object.fromEntries(
    RATE_TIERS.map((tier) => [tier.id, suggestedRate(daily, tier)]),
  ) as RateTiers;
}

/** What the "Total" column shows for a tier. */
export function tierTotal(perDay: number, tier: RateTier): number {
  return perDay * tier.billedDays;
}

/** Whole percent off the daily rate, for the panel's hint. Zero or more. */
export function discountPercent(daily: number, perDay: number): number {
  if (daily <= 0) return 0;
  return Math.max(0, Math.round((1 - perDay / daily) * 100));
}

/**
 * The per-day rate a hire of `days` is charged at: the longest tier it
 * qualifies for, or the daily rate below a week.
 */
export function rateForDays(pricing: CarPricing, days: number): number {
  let rate = pricing.daily;
  for (const tier of RATE_TIERS) {
    if (days >= tier.minDays) rate = pricing.tiers[tier.id];
  }
  return rate;
}

/** The tier a hire of `days` falls in, or null below a week. */
export function tierForDays(days: number): RateTier | null {
  let found: RateTier | null = null;
  for (const tier of RATE_TIERS) {
    if (days >= tier.minDays) found = tier;
  }
  return found;
}

/* -------------------------------------------------------------------------- */
/* Kilometres                                                                  */
/* -------------------------------------------------------------------------- */

/**
 * Kilometres included for each day of a hire. Client policy from 2026-09-21,
 * replacing the unlimited kilometres the site promised before. Every kilometre
 * beyond the allowance is charged at the vehicle's own `pricing.extraKm`.
 *
 * One number, so the terms, the FAQ, the price card and the booking summary
 * cannot quote different allowances. The copy that states it in words is
 * listed in HANDOVER, 2026-09-21: change those too if this ever moves.
 */
export const KM_PER_DAY = 100;

/** Kilometres included in a hire of `days`. */
export function kmAllowance(days: number): number {
  return Math.max(0, days) * KM_PER_DAY;
}
