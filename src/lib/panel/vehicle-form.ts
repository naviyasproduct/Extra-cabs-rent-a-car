import { MAX_VEHICLE_FEATURES } from "@/types";
import type { PanelFuel } from "@/lib/panel/types";

/**
 * Turning what someone typed into a vehicle form into values the fleet can
 * hold.
 *
 * Pure functions, no store and no session, so they can be tested directly.
 * They live here rather than in `actions.ts` because that file is
 * `"use server"`, where **every export must be an async server action**: a
 * plain exported helper there is a build error, and a non-exported one cannot
 * be reached by a test.
 */

const FUELS: PanelFuel[] = ["petrol", "diesel", "electric"];

/**
 * The fuel a select submitted, pinned to one we recognise.
 *
 * Anything unknown becomes petrol rather than reaching the store. "hybrid" is
 * the case that matters: it was a fuel option until the drivetrain was split
 * out, so an old bookmarked form or a stale client can still post it, and it
 * must not land back in the data as a fuel.
 */
export function fuelChoice(raw: FormDataEntryValue | null): PanelFuel {
  const value = String(raw ?? "").trim().toLowerCase();
  return (FUELS as string[]).includes(value) ? (value as PanelFuel) : "petrol";
}

/** An unchecked checkbox submits nothing at all, which is the false case. */
export function checkbox(raw: FormDataEntryValue | null): boolean {
  return raw === "on" || raw === "true";
}

/** Keeps a typed-in spec inside something a real vehicle could have. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

/** A trimmed, length-capped single value straight from a form field. */
export function plainText(raw: FormDataEntryValue | null, max: number): string {
  return String(raw ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, max);
}

/**
 * "Features and equipment", one per line.
 *
 * A textarea is the right control here: the owner is writing a list of unknown
 * length, not filling a fixed number of boxes, and one line per feature is
 * exactly how the list reads on the vehicle page.
 *
 * Leading bullet characters are stripped because this list gets pasted out of
 * a document far more often than it is typed, and without this every item on
 * the public page would start with a stray dash or bullet glyph.
 */
export function featureLines(raw: FormDataEntryValue | null): string[] {
  return String(raw ?? "")
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((line) => line.replace(/^[\s*•.-]+/, "").trim())
    .filter((line) => line.length > 0)
    .map((line) => line.slice(0, 90))
    .slice(0, MAX_VEHICLE_FEATURES);
}

/**
 * A rate that may legitimately be absent.
 *
 * Blank means null, which for `withDriverDaily` is what makes a vehicle read
 * as self drive only on the public page. Zero is treated as blank rather than
 * as a free chauffeur.
 */
export function optionalRate(raw: FormDataEntryValue | null): number | null {
  const value = String(raw ?? "").trim();
  if (value === "") return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) || parsed <= 0 ? null : Math.round(parsed);
}
