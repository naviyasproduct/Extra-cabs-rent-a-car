import type { ServiceSlug } from "./service";

export type BookingStep = "trip" | "vehicle" | "details" | "review";

/**
 * Which identity document the customer chose to show. They pick one, they do
 * not give both: a Sri Lankan resident has an NIC, a visitor has a passport.
 */
export type IdDocumentType = "nic" | "passport";

/**
 * Every image the booking can carry. The NIC and the driving licence are cards
 * with two printed faces, so each is two separate uploads rather than one, and
 * staff can read the address and the endorsements without asking again. The
 * passport is a booklet and its photo page is the only face that matters.
 */
export type DocumentSlot =
  | "nic-front"
  | "nic-back"
  | "passport"
  | "licence-front"
  | "licence-back";

/** What the browser gets back after an upload, and what the booking stores. */
export interface UploadedDocument {
  id: string;
  slot: DocumentSlot;
  /** As the customer's device named it. Display only, never a path. */
  fileName: string;
  contentType: string;
  /** Bytes. */
  size: number;
  uploadedAt: string;
}

/** The slots that must be filled before a booking can be confirmed. */
export function requiredSlots(idType: IdDocumentType): DocumentSlot[] {
  return idType === "nic"
    ? ["nic-front", "nic-back", "licence-front", "licence-back"]
    : ["passport", "licence-front", "licence-back"];
}

export interface BookingDraft {
  serviceType: ServiceSlug;
  pickupLocation: string;
  dropoffLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
  carSlug: string | null;
  withDriver: boolean;
  extras: string[];
  fullName: string;
  email: string;
  /** The number we call. */
  phone: string;
  /**
   * The number we message. Kept apart from `phone` because the agency asks for
   * two reachable numbers, and because a WhatsApp account is not always on the
   * handset someone answers calls on.
   */
  whatsapp: string;
  idType: IdDocumentType;
  /** Filled in as each upload finishes. Keyed by slot so a re-upload replaces. */
  documents: Partial<Record<DocumentSlot, UploadedDocument>>;
  notes: string;
}

export interface BookingExtra {
  id: string;
  label: string;
  description: string;
  /** LKR per day. 0 means included at no charge. */
  pricePerDay: number;
}
