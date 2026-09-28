import "server-only";
import crypto from "node:crypto";
import { insertTapCard, listTapCards, newId, tapCardByToken, updateTapCard } from "./db";
import { siteUrl } from "@/lib/data/site";
import type { StaffUser, TapCard } from "./types";

/**
 * The tap card: an NFC tag glued to the office desk that starts and ends a
 * shift when an employee taps their own phone on it.
 *
 * **The card proves the place. The phone proves the person.** That split is
 * the whole design and it is the client's:
 *
 *   - The card never leaves the desk, so it cannot be taken home, and it is
 *     not issued to anybody. One card serves both employees.
 *   - The page it opens does nothing until it finds a signed-in staff
 *     session, which lives on that employee's own phone.
 *
 * So clocking in requires being at the desk AND being signed in as yourself,
 * which is the thing the timesheet is supposed to evidence.
 *
 * **A plain URL on the tag, not Web NFC.** Every iPhone from the XS and every
 * Android reads a URL tag with no app installed. Web NFC (the browser reading
 * the tag itself) is Chromium on Android only, about 6% of browsers, and
 * Safari does not implement it, so it would have excluded iPhones entirely.
 *
 * **What this does not stop.** The URL is visible in the address bar once the
 * page opens, so an employee who writes it down can open it from home. They
 * still need their own session, so this is deliberate cheating rather than a
 * stranger walking in, and the proven-presence heartbeat already shows the
 * owner a claimed shift with no presence behind it. Closing it completely
 * needs a tag that signs every tap (NTAG 424 DNA): hardware, not code.
 */

/** 32 hex characters. The same shape as the document ids, for the same reason. */
const TOKEN_PATTERN = /^[0-9a-f]{32}$/;

export function isTapToken(value: string): boolean {
  return TOKEN_PATTERN.test(value);
}

/** The address to write onto the tag. */
export function tapUrl(token: string): string {
  return `${siteUrl}/tap/${token}`;
}

export async function listCards(): Promise<TapCard[]> {
  return listTapCards();
}

export async function createTapCard(owner: StaffUser, label: string): Promise<TapCard> {
  const card: Omit<TapCard, "createdAt"> = {
    id: newId("tap"),
    token: crypto.randomBytes(16).toString("hex"),
    label: label.trim().slice(0, 60),
    active: true,
    createdBy: owner.id,
    lastTapAt: null,
  };
  await insertTapCard(card);
  return { ...card, createdAt: new Date().toISOString() };
}

export type CardLookup =
  | { state: "unknown" }
  | { state: "revoked"; card: TapCard }
  | { state: "ok"; card: TapCard };

/**
 * Resolves a token from the URL.
 *
 * The pattern is checked before the database is touched, so a junk path never
 * becomes a query. A revoked card is reported as revoked rather than as
 * unknown: staff tapping a card the owner turned off should be told that,
 * not left thinking the tag is broken.
 */
export async function lookupTapCard(token: string): Promise<CardLookup> {
  if (!isTapToken(token)) return { state: "unknown" };
  const card = await tapCardByToken(token);
  if (!card) return { state: "unknown" };
  return card.active ? { state: "ok", card } : { state: "revoked", card };
}

export async function setCardActive(id: string, active: boolean): Promise<void> {
  await updateTapCard(id, { active });
}

/** Stamped whenever the page is opened from a card, for the owner's benefit. */
export async function recordTap(id: string): Promise<void> {
  await updateTapCard(id, { lastTapAt: new Date().toISOString() });
}
