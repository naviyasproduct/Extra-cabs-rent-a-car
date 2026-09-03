/** Tiny classname joiner. Keeps JSX readable without pulling in a dependency. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

const lkr = new Intl.NumberFormat("en-LK", {
  maximumFractionDigits: 0,
});

/** 14500 -> "LKR 14,500" */
export function formatPrice(amount: number): string {
  return `LKR ${lkr.format(amount)}`;
}

/** 14500 -> "14,500" when the currency label is already on screen. */
export function formatNumber(amount: number): string {
  return lkr.format(amount);
}

/** Turns a slug into a readable label: "self-drive-rental" -> "Self drive rental" */
export function humanise(slug: string): string {
  const spaced = slug.replace(/-/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

/** Whole days between two ISO date strings, minimum 1. */
export function daysBetween(start: string, end: string): number {
  if (!start || !end) return 1;
  const from = new Date(start).getTime();
  const to = new Date(end).getTime();
  if (Number.isNaN(from) || Number.isNaN(to)) return 1;
  const days = Math.ceil((to - from) / 86_400_000);
  return days > 0 ? days : 1;
}

/** ISO date string for today, used as the min= on date inputs. */
export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/** ISO date string N days from today. */
export function isoDaysFromNow(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
