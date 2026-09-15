/**
 * Phone numbers and email addresses: parsing, and whether we can actually use
 * them.
 *
 * Deliberately PURE and client-safe. No node built-ins, no secrets, no data
 * imports. The booking form validates with these in the browser and
 * lib/sms/textlk.ts formats with the same functions on the server, so the two
 * cannot disagree about what a usable number is. textlk.ts re-exports toMsisdn
 * and displayMsisdn, which is why moving them here changed no call site.
 */

/* -------------------------------------------------------------------------- */
/* Phone numbers                                                               */
/* -------------------------------------------------------------------------- */

/**
 * The characters a person may legitimately type in a phone field. Spaces,
 * hyphens, brackets and dots are formatting people genuinely use; a leading
 * plus is the international prefix. Everything else is stripped as it is typed,
 * which is what keeps letters out of the field on a desktop keyboard where
 * inputMode cannot help.
 */
export function sanitisePhoneInput(raw: string): string {
  const kept = raw.replace(/[^\d+\s().-]/g, "");
  // Only one plus, and only at the front: "+94 77" is a number, "9+4" is a typo.
  const plus = kept.trimStart().startsWith("+");
  return (plus ? "+" : "") + kept.replace(/\+/g, "");
}

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

export type PhoneKind = "lk-mobile" | "lk-landline" | "international";

export type PhoneCheck =
  | { ok: true; kind: PhoneKind; e164: string }
  | { ok: false; reason: string };

/**
 * Is this number one we could actually reach someone on?
 *
 * Two shapes are accepted, and the distinction matters:
 *
 *   - a Sri Lankan number, in any of the four forms toMsisdn takes. Mobile
 *     prefixes are 07X, so the national part starting with 7 is what separates
 *     a mobile from an 011 Colombo landline.
 *   - any other country, written in full international form with a leading
 *     plus. VISITORS ARE A REAL CUSTOMER SEGMENT HERE: step 3 offers a passport
 *     precisely because people fly in and hire a car, and their WhatsApp is on
 *     a foreign number. Refusing those would refuse the booking.
 *
 * A bare number with no plus and no leading zero is read as Sri Lankan, which
 * is the right guess in Colombo.
 */
export function checkPhone(raw: string): PhoneCheck {
  const trimmed = String(raw ?? "").trim();
  if (trimmed.length === 0) return { ok: false, reason: "Enter a mobile number." };

  if (/[A-Za-z]/.test(trimmed)) {
    return { ok: false, reason: "Numbers only, no letters." };
  }

  const international = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");

  if (digits.length === 0) {
    return { ok: false, reason: "Enter a mobile number." };
  }

  // Sri Lanka, however it was written.
  const looksLocal = !international || digits.startsWith("94");
  if (looksLocal) {
    const msisdn = toMsisdn(trimmed);
    if (!msisdn) {
      return {
        ok: false,
        reason:
          digits.length < 9
            ? "That is too short for a Sri Lankan number."
            : "Check that number. A Sri Lankan mobile looks like 077 123 4567.",
      };
    }
    const national = msisdn.slice(2);
    return {
      ok: true,
      kind: national.startsWith("7") ? "lk-mobile" : "lk-landline",
      e164: `+${msisdn}`,
    };
  }

  // Anywhere else. E.164 allows up to 15 digits including the country code,
  // and nothing real is shorter than 8.
  if (digits.length < 8 || digits.length > 15) {
    return { ok: false, reason: "Check that international number." };
  }
  return { ok: true, kind: "international", e164: `+${digits}` };
}

/**
 * The same check, plus the one extra thing a WhatsApp number has to be.
 *
 * A Colombo landline parses perfectly well and can never receive a WhatsApp
 * message, so it is refused here and allowed on the field we only ring.
 */
export function checkWhatsApp(raw: string): PhoneCheck {
  const result = checkPhone(raw);
  if (!result.ok) return result;
  if (result.kind === "lk-landline") {
    return {
      ok: false,
      reason: "That is a landline. WhatsApp needs a mobile number.",
    };
  }
  return result;
}

/** Digits only, so a number typed local and international reads as one. */
export function samePhone(a: string, b: string): boolean {
  const left = checkPhone(a);
  const right = checkPhone(b);
  if (left.ok && right.ok) return left.e164 === right.e164;
  // Fall back to a bare digit comparison while one of them is still half typed,
  // so the warning appears as the second number is being repeated rather than
  // only once it is complete.
  const bare = (value: string) =>
    value.replace(/\D/g, "").replace(/^0+/, "").replace(/^94/, "");
  return bare(a).length > 0 && bare(a) === bare(b);
}

/* -------------------------------------------------------------------------- */
/* Email                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * Is this a real address?
 *
 * Nothing short of sending to it can answer that, and this does not pretend
 * otherwise. What it does is reject the things that are definitely not
 * deliverable, which is where almost every bad address in a booking form comes
 * from: a missing dot in the domain, a trailing comma, two @ signs, a space in
 * the middle, "gmail" with no ".com".
 *
 * Deliberately NOT one of the giant RFC 5322 regexes. Those accept quoted local
 * parts and bracketed IP domains that no customer will ever type, and they are
 * unreadable, so nobody can tell what they actually allow.
 */
export function checkEmail(raw: string): { ok: true } | { ok: false; reason: string } {
  const value = String(raw ?? "").trim();
  if (value.length === 0) return { ok: false, reason: "Enter an email address." };
  if (/\s/.test(value)) return { ok: false, reason: "An email address has no spaces in it." };

  const parts = value.split("@");
  if (parts.length !== 2) {
    return {
      ok: false,
      reason: parts.length < 2 ? "An email address needs an @." : "Only one @, please.",
    };
  }

  const [local, domain] = parts;

  if (local.length === 0) return { ok: false, reason: "Add the part before the @." };
  if (local.length > 64) return { ok: false, reason: "That address is too long." };
  if (local.startsWith(".") || local.endsWith(".")) {
    return { ok: false, reason: "An email address cannot start or end the name with a dot." };
  }
  if (local.includes("..")) return { ok: false, reason: "Two dots together is a typo." };
  if (!/^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+$/.test(local)) {
    return { ok: false, reason: "That has a character an email address cannot hold." };
  }

  if (domain.length === 0) return { ok: false, reason: "Add the part after the @." };
  if (domain.length > 255) return { ok: false, reason: "That address is too long." };
  if (!domain.includes(".")) {
    return { ok: false, reason: "The part after the @ needs a dot, like gmail.com." };
  }
  if (domain.startsWith(".") || domain.endsWith(".") || domain.includes("..")) {
    return { ok: false, reason: "Check the part after the @." };
  }
  // Per LABEL, not per domain: "bad-.com" has no hyphen at either end of the
  // whole string, but the label "bad-" is still not a registrable name.
  const labels = domain.split(".");
  const badLabel = labels.some(
    (label) =>
      label.length === 0 ||
      label.startsWith("-") ||
      label.endsWith("-") ||
      !/^[A-Za-z0-9-]+$/.test(label),
  );
  if (badLabel) {
    return { ok: false, reason: "Check the part after the @." };
  }

  // The last label is the top level domain. It is letters, and at least two.
  const tld = labels[labels.length - 1];
  if (!/^[A-Za-z]{2,}$/.test(tld)) {
    return { ok: false, reason: "That does not end in a real domain, like .com or .lk." };
  }

  return { ok: true };
}
