/**
 * Internal platform domain types.
 *
 * Mirrors the data model in docs/internal-platform-plan.md section 9. When
 * Supabase lands these become table rows; the shapes should not need to change.
 */

import type { IdDocumentType, UploadedDocument } from "@/types/booking";

export type Role = "owner" | "employee";

export interface StaffUser {
  id: string;
  name: string;
  email: string;
  role: Role;
  /** scrypt. The plaintext never reaches the store. */
  passwordHash: string;
  passwordSalt: string;
  active: boolean;
  createdAt: string;
  /** Shown once when the owner creates an account, then cleared. */
  oneTimePassword: string | null;
  /**
   * Mobile number, as the person typed it. Normalised to 94XXXXXXXXX only at
   * the moment of sending, so what the owner entered is what he sees again.
   * Empty means this person is simply not reachable by SMS yet.
   */
  phone: string;
  /** Off switch per person. Undefined counts as on, for rows written before this. */
  smsAlerts: boolean;
}

/* -------------------------------------------------------------------------- */
/* The timesheet: two records per day                                          */
/* -------------------------------------------------------------------------- */

export type ShiftEndReason = "manual_signout" | "shift_expiry" | "owner_closed";

/** The claim: what the employee says they worked. */
export interface WorkShift {
  id: string;
  staffId: string;
  /** Asia/Colombo calendar day, YYYY-MM-DD. */
  workDate: string;
  signedInAt: string;
  /** Null means they never pressed Sign out. Never guess a value here. */
  signedOutAt: string | null;
  endReason: ShiftEndReason | null;
}

export type PresenceEnd =
  | "sign_out"
  | "heartbeat_timeout"
  | "tab_hidden"
  | "browser_closed";

/** The evidence: a stretch of time presence was actually proven. */
export interface PresenceSegment {
  id: string;
  shiftId: string;
  staffId: string;
  fromAt: string;
  toAt: string | null;
  lastHeartbeatAt: string;
  endedBy: PresenceEnd | null;
}

/* -------------------------------------------------------------------------- */
/* The write window                                                            */
/* -------------------------------------------------------------------------- */

export type WindowScope =
  | "fleet.create"
  | "fleet.update"
  | "fleet.delete"
  | "fleet.photos"
  | "pricing.update"
  | "booking.delete";

export type AccessStatus = "awaiting_code" | "open" | "closed" | "burned";

export interface AccessRequest {
  id: string;
  staffId: string;
  shiftId: string | null;
  scope: WindowScope;
  /** When set, the window opens on this vehicle only. */
  targetSlug: string | null;
  reason: string;
  /** HMAC-SHA256 of the code. Nulled the moment it is consumed. */
  codeHash: string | null;
  attempts: number;
  status: AccessStatus;
  createdAt: string;
  codeExpiresAt: string;
  windowExpiresAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  /**
   * DEV ONLY. There is no SMS yet, so the owner reads the code off his own
   * screen instead of a text message. Delete this field when Text.lk is wired.
   */
  devCode: string | null;
}

/* -------------------------------------------------------------------------- */
/* Audit                                                                       */
/* -------------------------------------------------------------------------- */

export interface AuditEntry {
  id: string;
  at: string;
  staffId: string;
  action: string;
  entity: "vehicle" | "booking" | "enquiry" | "staff" | "access" | "shift";
  entityId: string;
  summary: string;
  accessRequestId: string | null;
}

/* -------------------------------------------------------------------------- */
/* Bookings                                                                    */
/* -------------------------------------------------------------------------- */

export type BookingStatus =
  | "pending"
  | "confirmed"
  | "on_hire"
  | "returned"
  | "cancelled";

export type PaymentMethod =
  | "unpaid"
  | "cash"
  | "bank_transfer"
  | "card_on_pickup";

export interface PanelBooking {
  id: string;
  reference: string;
  carSlug: string | null;
  customerName: string;
  /** The number staff call. */
  phone: string;
  /**
   * The number staff message. The website asks for both and requires them to
   * differ; a booking taken by phone in the panel may legitimately have none.
   */
  whatsapp: string;
  email: string;
  pickupLocation: string;
  pickupDate: string;
  returnDate: string;
  withDriver: boolean;
  notes: string;
  status: BookingStatus;
  paymentMethod: PaymentMethod;
  amount: number;
  createdAt: string;
  handledBy: string | null;
  source: "website" | "panel";
  /** Which identity document the customer chose to send. */
  idType: IdDocumentType;
  /**
   * Identity documents, metadata only. The bytes live in .data/uploads via
   * lib/panel/uploads.ts and are served solely by /api/panel/documents/[id],
   * which requires a staff session. Never put an image in this store: the
   * whole JSON file is read and rewritten on every request.
   */
  documents: UploadedDocument[];
  /**
   * NIC or passport number and driving licence number, typed by staff at
   * handover. These are what keep a past customer identifiable after the
   * photos are deleted (see lib/panel/retention-rules.ts). Empty until typed.
   */
  idNumber: string;
  licenceNumber: string;
  /**
   * When the booking was marked returned or cancelled. The retention clock
   * starts here. Null while the booking is still live.
   */
  closedAt: string | null;
  /**
   * Set by staff while a fine, damage claim or dispute is open. The photos
   * are never deleted while this is true.
   */
  documentsHold: boolean;
  /** When the photos were deleted under the retention rule. Null if never. */
  documentsPurgedAt: string | null;
}

/* -------------------------------------------------------------------------- */
/* Enquiries                                                                   */
/* -------------------------------------------------------------------------- */

export interface EnquiryMessage {
  id: string;
  at: string;
  /** Null for the customer's own message. */
  fromStaffId: string | null;
  body: string;
}

export interface Enquiry {
  id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  createdAt: string;
  status: "open" | "answered" | "closed";
  assignedTo: string | null;
  messages: EnquiryMessage[];
}

/* -------------------------------------------------------------------------- */
/* Fleet edits                                                                 */
/* -------------------------------------------------------------------------- */

/**
 * What a vehicle actually burns.
 *
 * Mirrors FuelType in src/types/car.ts, spelled out rather than imported so
 * the panel types stay a standalone description of what is on disk. Hybrid is
 * deliberately absent: a hybrid runs on petrol, and the drivetrain is its own
 * boolean.
 */
export type PanelFuel = "petrol" | "diesel" | "electric";

/**
 * Per-day rate in LKR for each long-hire duration.
 *
 * Mirrors RateTiers in src/types/car.ts, spelled out for the same reason as
 * PanelFuel. Totals are not stored: they are always rate times days.
 */
export type PanelRateTiers = Record<
  "week1" | "week2" | "week3" | "month1" | "month3" | "month6",
  number
>;

/**
 * Changes layered over the static fleet in src/lib/data/cars.ts.
 *
 * The catalogue file stays untouched so the panel never has to rewrite source
 * code. Only the fields a person can actually edit live here.
 */
export interface VehicleOverride {
  name?: string;
  /** One-line hook under the vehicle name. */
  tagline?: string;
  /** The "About this vehicle" paragraph. */
  description?: string;
  /** The "Features and equipment" list, in display order. */
  features?: string[];
  available?: boolean;
  featured?: boolean;
  daily?: number;
  /** Merged over the vehicle's own tiers, so a partial set is valid. */
  tiers?: Partial<PanelRateTiers>;
  /** Legacy. Migrated into `tiers` by hydrate() and then removed. */
  weekly?: number;
  /** Legacy. Migrated into `tiers` by hydrate() and then removed. */
  monthly?: number;
  deposit?: number;
  /** LKR per km beyond the allowance. Null clears it back to "ask us". */
  extraKm?: number | null;
  withDriverDaily?: number | null;
  seats?: number;
  doors?: number;
  /** What the vehicle burns. Hybrid is a separate flag, not a fuel. */
  fuel?: PanelFuel;
  /** Petrol or diesel engine paired with an electric motor. */
  hybrid?: boolean;
  /** ISO timestamp. Soft delete: hidden everywhere, restorable for 30 days. */
  deletedAt?: string | null;
}

/** A vehicle added through the panel rather than shipped in the catalogue. */
export interface CreatedVehicle {
  slug: string;
  name: string;
  brand: string;
  year: number;
  category: string;
  /** One-line hook under the vehicle name. */
  tagline: string;
  /** The "About this vehicle" paragraph. */
  description: string;
  /** The "Features and equipment" list, in display order. */
  features: string[];
  seats: number;
  doors: number;
  luggage: number;
  transmission: "automatic" | "manual";
  fuel: PanelFuel;
  /** Petrol or diesel engine paired with an electric motor. */
  hybrid: boolean;
  engineCc: number;
  daily: number;
  tiers: PanelRateTiers;
  /** Legacy. Migrated into `tiers` by hydrate() and then removed. */
  weekly?: number;
  /** Legacy. Migrated into `tiers` by hydrate() and then removed. */
  monthly?: number;
  deposit: number;
  /** LKR per km beyond the allowance. Null until someone sets one. */
  extraKm: number | null;
  withDriverDaily: number | null;
  images: string[];
  available: boolean;
  featured: boolean;
  createdAt: string;
  createdBy: string;
  deletedAt: string | null;
}

/* -------------------------------------------------------------------------- */
/* Outbound SMS                                                                */
/* -------------------------------------------------------------------------- */

export type SmsKind = "booking.created" | "test";

export type SmsStatus =
  /** Accepted by Text.lk. */
  | "sent"
  /** Text.lk or the network refused it. `error` says why. */
  | "failed"
  /** No credentials configured, so nothing was attempted. */
  | "skipped";

/**
 * One send attempt, one row.
 *
 * The plan asks for the provider message id to be stored so delivery can be
 * audited. This is that record, and it is also the only way anyone finds out
 * that the SMS credit ran out: a booking still succeeds, quietly, and the
 * failure shows up here.
 */
export interface SmsMessage {
  id: string;
  at: string;
  /** Normalised 94XXXXXXXXX. */
  to: string;
  /** Which staff member, when the recipient was one of ours. */
  staffId: string | null;
  kind: SmsKind;
  body: string;
  /** Billable segments at send time. See measure() in lib/sms/textlk.ts. */
  segments: number;
  status: SmsStatus;
  /** Text.lk's uid. Quote this at them when a message goes missing. */
  providerId: string | null;
  error: string | null;
}

/* -------------------------------------------------------------------------- */

export interface PanelData {
  staff: StaffUser[];
  shifts: WorkShift[];
  presence: PresenceSegment[];
  accessRequests: AccessRequest[];
  audit: AuditEntry[];
  bookings: PanelBooking[];
  enquiries: Enquiry[];
  vehicleOverrides: Record<string, VehicleOverride>;
  createdVehicles: CreatedVehicle[];
  messages: SmsMessage[];
}
