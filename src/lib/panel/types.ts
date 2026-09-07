/**
 * Internal platform domain types.
 *
 * Mirrors the data model in docs/internal-platform-plan.md section 9. When
 * Supabase lands these become table rows; the shapes should not need to change.
 */

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
  phone: string;
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
 * Changes layered over the static fleet in src/lib/data/cars.ts.
 *
 * The catalogue file stays untouched so the panel never has to rewrite source
 * code. Only the fields a person can actually edit live here.
 */
export interface VehicleOverride {
  name?: string;
  available?: boolean;
  featured?: boolean;
  daily?: number;
  weekly?: number;
  monthly?: number;
  deposit?: number;
  withDriverDaily?: number | null;
  seats?: number;
  doors?: number;
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
  description: string;
  seats: number;
  doors: number;
  luggage: number;
  transmission: "automatic" | "manual";
  fuel: "petrol" | "diesel" | "hybrid" | "electric";
  engineCc: number;
  daily: number;
  weekly: number;
  monthly: number;
  deposit: number;
  withDriverDaily: number | null;
  images: string[];
  available: boolean;
  featured: boolean;
  createdAt: string;
  createdBy: string;
  deletedAt: string | null;
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
}
