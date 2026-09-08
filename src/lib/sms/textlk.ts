/**
 * The Text.lk SMS gateway.
 *
 * SERVER ONLY. This module holds the API token; never import it from a client
 * component.
 *
 * Docs: https://text.lk/docs/send-sms/
 *
 *   POST https://app.text.lk/api/v3/sms/send
 *   Authorization: Bearer <TEXTLK_API_TOKEN>
 *   { recipient, sender_id, type: "plain", message }
 *
 * Nothing in here throws at the caller. A customer's booking must never fail
 * because a text message did not go out, so every path returns a result object
 * and the failure is recorded instead. See notify.ts for where that lands.
 */

const ENDPOINT = "https://app.text.lk/api/v3/sms/send";

/** Text.lk answers in well under a second. Ten is generous, not a target. */
const TIMEOUT_MS = 10_000;

/* -------------------------------------------------------------------------- */
/* Configuration                                                               */
/* -------------------------------------------------------------------------- */

export function smsConfig() {
  const token = (process.env.TEXTLK_API_TOKEN ?? "").trim();
  const senderId = (process.env.TEXTLK_SENDER_ID ?? "").trim();
  // One switch to stop every send without pulling the credentials out. Useful
  // on a preview deployment, where real texts to the owner are just noise.
  const enabled = (process.env.SMS_ENABLED ?? "true").trim() !== "false";
  return { token, senderId, enabled, ready: enabled && token.length > 0 && senderId.length > 0 };
}

/* -------------------------------------------------------------------------- */
/* Phone numbers                                                               */
/* -------------------------------------------------------------------------- */

/**
 * Anything a person might type, to the 94XXXXXXXXX form Text.lk wants.
 *
 * Accepts "+94 77 123 4567", "077 123 4567", "0771234567", "94771234567".
 * Returns null for anything that is not a plausible Sri Lankan number, and the
 * caller drops that recipient rather than sending into the void.
 */
export function toMsisdn(raw: string): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length === 0) return null;

  let national: string;
  if (digits.startsWith("94")) national = digits.slice(2);
  else if (digits.startsWith("0")) national = digits.slice(1);
  else national = digits;

  // Sri Lankan subscriber numbers are nine digits after the country code, and
  // the leading zero of the national form is not one of them.
  if (!/^[1-9]\d{8}$/.test(national)) return null;
  return `94${national}`;
}

/** The same number in the form a Sri Lankan reads on screen: 077 123 4567. */
export function displayMsisdn(msisdn: string): string {
  const national = msisdn.startsWith("94") ? msisdn.slice(2) : msisdn;
  if (national.length !== 9) return msisdn;
  return `0${national.slice(0, 2)} ${national.slice(2, 5)} ${national.slice(5)}`;
}

/* -------------------------------------------------------------------------- */
/* Message length                                                              */
/* -------------------------------------------------------------------------- */

/**
 * GSM 03.38, the 7-bit alphabet an SMS is billed in.
 *
 * This matters commercially, not cosmetically: a message inside this set gets
 * 160 characters per segment, and one character outside it drops the whole
 * message to 70. A single Sinhala letter or a curly quote pasted out of Word
 * therefore doubles or triples the bill. See the plan, "SMS practicalities".
 */
const GSM_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅå" +
  "Δ_ΦΓΛΩΠΨΣΘΞÆæßÉ" +
  " !\"#¤%&'()*+,-./0123456789:;<=>?" +
  "¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§" +
  "¿abcdefghijklmnopqrstuvwxyzäöñüà";

/** These exist in GSM-7 but cost two characters each. */
const GSM_EXTENDED = "^{}\\[~]|€";

/** Weighted GSM-7 length, or null when the text needs 16-bit encoding. */
function gsmLength(text: string): number | null {
  let length = 0;
  for (const char of text) {
    if (GSM_BASIC.includes(char)) length += 1;
    else if (GSM_EXTENDED.includes(char)) length += 2;
    else return null;
  }
  return length;
}

export interface MessageCost {
  encoding: "GSM-7" | "UCS-2";
  /** Billable characters, extension characters counted twice. */
  length: number;
  /** What Text.lk will charge for. */
  segments: number;
}

export function measure(text: string): MessageCost {
  const gsm = gsmLength(text);
  if (gsm !== null) {
    return {
      encoding: "GSM-7",
      length: gsm,
      segments: gsm <= 160 ? 1 : Math.ceil(gsm / 153),
    };
  }
  const length = [...text].length;
  return {
    encoding: "UCS-2",
    length,
    segments: length <= 70 ? 1 : Math.ceil(length / 67),
  };
}

/* -------------------------------------------------------------------------- */
/* Sending                                                                     */
/* -------------------------------------------------------------------------- */

export interface SendOutcome {
  ok: boolean;
  /** True when nothing was attempted because the gateway is not configured. */
  skipped: boolean;
  /** Text.lk's own id for the message, kept so a send can be audited later. */
  providerId: string | null;
  cost: string | null;
  error: string | null;
}

/**
 * One message to one number.
 *
 * Text.lk accepts a comma-separated recipient list, and we deliberately do not
 * use it: one call per person means one delivery record per person, so "the
 * owner got it and Kasun did not" is a fact in the log rather than a guess.
 */
export async function sendSms(msisdn: string, message: string): Promise<SendOutcome> {
  const { token, senderId, ready } = smsConfig();

  if (!ready) {
    // Development, or a deployment with no credentials. Print it so the flow is
    // still testable end to end, and say plainly that nothing was sent.
    console.info(`[sms] not configured, would send to ${msisdn}: ${message}`);
    return { ok: false, skipped: true, providerId: null, cost: null, error: null };
  }

  try {
    const response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        recipient: msisdn,
        sender_id: senderId,
        type: "plain",
        message,
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });

    // Read as text first. A gateway having a bad day answers with an HTML error
    // page, and response.json() on that throws something unhelpful.
    const raw = await response.text();
    let body: {
      status?: string;
      message?: string;
      data?: { uid?: string; cost?: string };
    } = {};
    try {
      body = JSON.parse(raw) as typeof body;
    } catch {
      return {
        ok: false,
        skipped: false,
        providerId: null,
        cost: null,
        error: `HTTP ${response.status}: ${raw.slice(0, 120)}`,
      };
    }

    if (!response.ok || body.status !== "success") {
      return {
        ok: false,
        skipped: false,
        providerId: null,
        cost: null,
        error: body.message ?? `HTTP ${response.status}`,
      };
    }

    return {
      ok: true,
      skipped: false,
      providerId: body.data?.uid ?? null,
      cost: body.data?.cost ?? null,
      error: null,
    };
  } catch (error) {
    // Timeout, DNS, TLS, offline. Never rethrow: the caller is finishing a
    // customer's booking.
    return {
      ok: false,
      skipped: false,
      providerId: null,
      cost: null,
      error: error instanceof Error ? error.message : "Unknown network error",
    };
  }
}
