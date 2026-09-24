import "server-only";
import crypto from "node:crypto";
import { admin } from "@/lib/supabase/admin";
import type {
  AccessRequest,
  AuditEntry,
  Enquiry,
  EnquiryMessage,
  PanelBooking,
  PresenceSegment,
  SmsMessage,
  StaffUser,
  VehicleRecord,
  WorkShift,
} from "./types";

/**
 * Every read and write of panel data. Nothing else talks to the tables.
 *
 * SERVER ONLY, and it runs with the service role, which bypasses row level
 * security. It does NO permission checks of its own: callers must pass
 * src/lib/panel/guard.ts first. That split is deliberate; see the header of
 * supabase/migrations/20260921000000_panel_init.sql.
 *
 * Column names are snake_case in Postgres and camelCase in the app. The two
 * converters below are SHALLOW on purpose: jsonb columns (`tiers`,
 * `documents`) keep whatever keys the app wrote into them.
 *
 * Every function throws on a database error, with the operation named. A
 * failed write must never read as a successful one.
 */

type Row = Record<string, unknown>;

function toCamel<T>(row: Row): T {
  const out: Row = {};
  for (const [key, value] of Object.entries(row)) {
    out[key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())] = value;
  }
  return out as T;
}

function toSnake(obj: object): Row {
  const out: Row = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    out[key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`)] = value;
  }
  return out;
}

function fail(what: string, error: { message: string; code?: string }): never {
  throw new Error(`[db] ${what}: ${error.message}${error.code ? ` (${error.code})` : ""}`);
}

/** A prefixed random id, the same shape the file store used. */
export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

/** The staff id written for actions the system takes by itself. */
export const SYSTEM_STAFF_ID = "system";

/* -------------------------------------------------------------------------- */
/* Staff                                                                       */
/* -------------------------------------------------------------------------- */

export async function getStaff(id: string): Promise<StaffUser | null> {
  const { data, error } = await admin().from("staff").select("*").eq("id", id).maybeSingle();
  if (error) fail("getStaff", error);
  return data ? toCamel<StaffUser>(data) : null;
}

export async function getStaffByEmail(email: string): Promise<StaffUser | null> {
  const { data, error } = await admin()
    .from("staff").select("*").eq("email", email.trim().toLowerCase()).maybeSingle();
  if (error) fail("getStaffByEmail", error);
  return data ? toCamel<StaffUser>(data) : null;
}

export async function listStaff(): Promise<StaffUser[]> {
  const { data, error } = await admin().from("staff").select("*").order("created_at");
  if (error) fail("listStaff", error);
  return (data ?? []).map((r) => toCamel<StaffUser>(r));
}

export async function insertStaff(staff: Omit<StaffUser, "createdAt">): Promise<void> {
  const { error } = await admin().from("staff").insert(toSnake(staff));
  if (error) fail("insertStaff", error);
}

export async function updateStaff(
  id: string,
  patch: Partial<Pick<StaffUser, "name" | "active" | "phone" | "smsAlerts">>,
): Promise<void> {
  const { error } = await admin().from("staff").update(toSnake(patch)).eq("id", id);
  if (error) fail("updateStaff", error);
}

/* -------------------------------------------------------------------------- */
/* Timesheet                                                                   */
/* -------------------------------------------------------------------------- */

/** Closes stale presence at its last heartbeat and expires old shifts. */
export async function sweepTimesheet(timeoutSeconds: number): Promise<void> {
  const { error } = await admin().rpc("panel_sweep", { timeout_seconds: timeoutSeconds });
  if (error) fail("sweepTimesheet", error);
}

export async function openShiftFor(staffId: string): Promise<WorkShift | null> {
  const { data, error } = await admin()
    .from("work_shifts").select("*")
    .eq("staff_id", staffId).is("signed_out_at", null).is("end_reason", null)
    .order("signed_in_at", { ascending: false }).limit(1).maybeSingle();
  if (error) fail("openShiftFor", error);
  return data ? toCamel<WorkShift>(data) : null;
}

export async function insertShift(shift: WorkShift): Promise<void> {
  const { error } = await admin().from("work_shifts").insert(toSnake(shift));
  if (error) fail("insertShift", error);
}

export async function updateShift(
  id: string,
  patch: Partial<Pick<WorkShift, "signedOutAt" | "endReason">>,
): Promise<void> {
  const { error } = await admin().from("work_shifts").update(toSnake(patch)).eq("id", id);
  if (error) fail("updateShift", error);
}

export async function shiftsOn(date: string): Promise<WorkShift[]> {
  const { data, error } = await admin()
    .from("work_shifts").select("*").eq("work_date", date).order("signed_in_at");
  if (error) fail("shiftsOn", error);
  return (data ?? []).map((r) => toCamel<WorkShift>(r));
}

/** Every shift an employee has ever had. For the lifetime totals on /panel/team. */
export async function allShifts(): Promise<WorkShift[]> {
  const { data, error } = await admin().from("work_shifts").select("*");
  if (error) fail("allShifts", error);
  return (data ?? []).map((r) => toCamel<WorkShift>(r));
}

export async function segmentsForShifts(shiftIds: string[]): Promise<PresenceSegment[]> {
  if (shiftIds.length === 0) return [];
  const { data, error } = await admin()
    .from("presence_segments").select("*").in("shift_id", shiftIds).order("from_at");
  if (error) fail("segmentsForShifts", error);
  return (data ?? []).map((r) => toCamel<PresenceSegment>(r));
}

export async function openSegmentForShift(shiftId: string): Promise<PresenceSegment | null> {
  const { data, error } = await admin()
    .from("presence_segments").select("*")
    .eq("shift_id", shiftId).is("to_at", null)
    .order("from_at", { ascending: false }).limit(1).maybeSingle();
  if (error) fail("openSegmentForShift", error);
  return data ? toCamel<PresenceSegment>(data) : null;
}

export async function openSegmentsForStaff(staffId: string): Promise<PresenceSegment[]> {
  const { data, error } = await admin()
    .from("presence_segments").select("*").eq("staff_id", staffId).is("to_at", null);
  if (error) fail("openSegmentsForStaff", error);
  return (data ?? []).map((r) => toCamel<PresenceSegment>(r));
}

export async function insertSegment(segment: PresenceSegment): Promise<void> {
  const { error } = await admin().from("presence_segments").insert(toSnake(segment));
  if (error) fail("insertSegment", error);
}

export async function updateSegment(
  id: string,
  patch: Partial<Pick<PresenceSegment, "toAt" | "lastHeartbeatAt" | "endedBy">>,
): Promise<void> {
  const { error } = await admin().from("presence_segments").update(toSnake(patch)).eq("id", id);
  if (error) fail("updateSegment", error);
}

/** Open segments that beat since `sinceIso`. */
export async function livePresenceSince(sinceIso: string): Promise<PresenceSegment[]> {
  const { data, error } = await admin()
    .from("presence_segments").select("*").is("to_at", null).gte("last_heartbeat_at", sinceIso);
  if (error) fail("livePresenceSince", error);
  return (data ?? []).map((r) => toCamel<PresenceSegment>(r));
}

/* -------------------------------------------------------------------------- */
/* Write windows                                                               */
/* -------------------------------------------------------------------------- */

export async function insertAccessRequest(request: AccessRequest): Promise<void> {
  const { error } = await admin().from("access_requests").insert(toSnake(request));
  if (error) fail("insertAccessRequest", error);
}

export async function getAccessRequest(id: string): Promise<AccessRequest | null> {
  const { data, error } = await admin().from("access_requests").select("*").eq("id", id).maybeSingle();
  if (error) fail("getAccessRequest", error);
  return data ? toCamel<AccessRequest>(data) : null;
}

export async function updateAccessRequest(
  id: string,
  patch: Partial<Omit<AccessRequest, "id" | "staffId" | "createdAt">>,
): Promise<void> {
  const { error } = await admin().from("access_requests").update(toSnake(patch)).eq("id", id);
  if (error) fail("updateAccessRequest", error);
}

export async function accessRequestsWithStatus(
  statuses: AccessRequest["status"][],
  staffId?: string,
): Promise<AccessRequest[]> {
  let query = admin().from("access_requests").select("*").in("status", statuses);
  if (staffId) query = query.eq("staff_id", staffId);
  const { data, error } = await query.order("created_at", { ascending: false });
  if (error) fail("accessRequestsWithStatus", error);
  return (data ?? []).map((r) => toCamel<AccessRequest>(r));
}

/* -------------------------------------------------------------------------- */
/* Audit                                                                       */
/* -------------------------------------------------------------------------- */

function auditFromRow(row: Row): AuditEntry {
  const entry = toCamel<AuditEntry & { staffId: string | null }>(row);
  return { ...entry, staffId: entry.staffId ?? SYSTEM_STAFF_ID };
}

export async function insertAudit(entry: Omit<AuditEntry, "id" | "at"> & { at?: string }): Promise<void> {
  const row = toSnake({
    ...entry,
    id: newId("aud"),
    at: entry.at ?? new Date().toISOString(),
    // The system acting on its own is stored as null: there is no staff row.
    staffId: entry.staffId === SYSTEM_STAFF_ID ? null : entry.staffId,
  });
  const { error } = await admin().from("audit").insert(row);
  if (error) fail("insertAudit", error);
}

export async function listAudit(options: { staffId?: string; limit?: number } = {}): Promise<AuditEntry[]> {
  let query = admin().from("audit").select("*");
  if (options.staffId) query = query.eq("staff_id", options.staffId);
  const { data, error } = await query.order("at", { ascending: false }).limit(options.limit ?? 300);
  if (error) fail("listAudit", error);
  return (data ?? []).map(auditFromRow);
}

/**
 * How many audit rows match. A count query, so lifetime totals stay exact
 * however long the log grows, rather than counting a truncated page of it.
 */
export async function countAudit(filter: {
  staffId: string;
  action?: string;
  entity?: AuditEntry["entity"];
}): Promise<number> {
  let query = admin().from("audit").select("id", { count: "exact", head: true }).eq("staff_id", filter.staffId);
  if (filter.action) query = query.eq("action", filter.action);
  if (filter.entity) query = query.eq("entity", filter.entity);
  const { count, error } = await query;
  if (error) fail("countAudit", error);
  return count ?? 0;
}

export async function auditForRequest(accessRequestId: string): Promise<AuditEntry[]> {
  const { data, error } = await admin()
    .from("audit").select("*").eq("access_request_id", accessRequestId).order("at");
  if (error) fail("auditForRequest", error);
  return (data ?? []).map(auditFromRow);
}

export async function auditForEntity(
  entity: AuditEntry["entity"],
  entityId: string,
  limit = 20,
): Promise<AuditEntry[]> {
  const { data, error } = await admin()
    .from("audit").select("*").eq("entity", entity).eq("entity_id", entityId)
    .order("at", { ascending: false }).limit(limit);
  if (error) fail("auditForEntity", error);
  return (data ?? []).map(auditFromRow);
}

/* -------------------------------------------------------------------------- */
/* Vehicles                                                                    */
/* -------------------------------------------------------------------------- */

export async function listVehicleRecords(): Promise<VehicleRecord[]> {
  const { data, error } = await admin()
    .from("vehicles").select("*")
    .order("featured", { ascending: false }).order("created_at");
  if (error) fail("listVehicleRecords", error);
  return (data ?? []).map((r) => toCamel<VehicleRecord>(r));
}

export async function getVehicleRecord(slug: string): Promise<VehicleRecord | null> {
  const { data, error } = await admin().from("vehicles").select("*").eq("slug", slug).maybeSingle();
  if (error) fail("getVehicleRecord", error);
  return data ? toCamel<VehicleRecord>(data) : null;
}

export async function vehicleSlugExists(slug: string): Promise<boolean> {
  const { count, error } = await admin()
    .from("vehicles").select("slug", { count: "exact", head: true }).eq("slug", slug);
  if (error) fail("vehicleSlugExists", error);
  return (count ?? 0) > 0;
}

export async function insertVehicle(vehicle: Omit<VehicleRecord, "createdAt">): Promise<void> {
  const { error } = await admin().from("vehicles").insert(toSnake(vehicle));
  if (error) fail("insertVehicle", error);
}

export async function updateVehicle(
  slug: string,
  patch: Partial<Omit<VehicleRecord, "slug" | "createdAt" | "createdBy">>,
): Promise<void> {
  const { error } = await admin().from("vehicles").update(toSnake(patch)).eq("slug", slug);
  if (error) fail("updateVehicle", error);
}

/* -------------------------------------------------------------------------- */
/* Bookings                                                                    */
/* -------------------------------------------------------------------------- */

export async function listBookings(): Promise<PanelBooking[]> {
  const { data, error } = await admin()
    .from("bookings").select("*").order("created_at", { ascending: false });
  if (error) fail("listBookings", error);
  return (data ?? []).map((r) => toCamel<PanelBooking>(r));
}

/** How many bookings have this status. A count query: no rows are fetched. */
export async function countBookings(status: PanelBooking["status"]): Promise<number> {
  const { count, error } = await admin()
    .from("bookings").select("id", { count: "exact", head: true }).eq("status", status);
  if (error) fail("countBookings", error);
  return count ?? 0;
}

/** How many enquiries have this status. A count query: no rows are fetched. */
export async function countEnquiries(status: Enquiry["status"]): Promise<number> {
  const { count, error } = await admin()
    .from("enquiries").select("id", { count: "exact", head: true }).eq("status", status);
  if (error) fail("countEnquiries", error);
  return count ?? 0;
}

export async function getBooking(id: string): Promise<PanelBooking | null> {
  const { data, error } = await admin().from("bookings").select("*").eq("id", id).maybeSingle();
  if (error) fail("getBooking", error);
  return data ? toCamel<PanelBooking>(data) : null;
}

/** A reference that is never reused, from the booking_reference_seq sequence. */
export async function nextBookingReference(): Promise<string> {
  const { data, error } = await admin().rpc("next_booking_reference");
  if (error) fail("nextBookingReference", error);
  return data as string;
}

export async function insertBooking(booking: PanelBooking): Promise<void> {
  const { error } = await admin().from("bookings").insert(toSnake(booking));
  if (error) fail("insertBooking", error);
}

export async function updateBooking(
  id: string,
  patch: Partial<Omit<PanelBooking, "id" | "reference" | "createdAt">>,
): Promise<void> {
  const { error } = await admin().from("bookings").update(toSnake(patch)).eq("id", id);
  if (error) fail("updateBooking", error);
}

export async function deleteBookingRow(id: string): Promise<void> {
  const { error } = await admin().from("bookings").delete().eq("id", id);
  if (error) fail("deleteBookingRow", error);
}

/* -------------------------------------------------------------------------- */
/* Enquiries                                                                   */
/* -------------------------------------------------------------------------- */

export async function listEnquiries(): Promise<Enquiry[]> {
  const { data, error } = await admin()
    .from("enquiries").select("*, enquiry_messages(*)")
    .order("created_at", { ascending: false });
  if (error) fail("listEnquiries", error);
  return (data ?? []).map((row: Row) => {
    const { enquiry_messages: messages, ...rest } = row as Row & { enquiry_messages: Row[] };
    return {
      ...toCamel<Omit<Enquiry, "messages">>(rest),
      messages: (messages ?? [])
        .map((m) => toCamel<EnquiryMessage>(m))
        .sort((a, b) => a.at.localeCompare(b.at)),
    };
  });
}

export async function insertEnquiry(
  enquiry: Omit<Enquiry, "messages">,
  firstMessage: EnquiryMessage,
): Promise<void> {
  const { error } = await admin().from("enquiries").insert(toSnake(enquiry));
  if (error) fail("insertEnquiry", error);
  await insertEnquiryMessage(enquiry.id, firstMessage);
}

export async function insertEnquiryMessage(enquiryId: string, message: EnquiryMessage): Promise<void> {
  const { error } = await admin()
    .from("enquiry_messages").insert({ ...toSnake(message), enquiry_id: enquiryId });
  if (error) fail("insertEnquiryMessage", error);
}

export async function updateEnquiry(
  id: string,
  patch: Partial<Pick<Enquiry, "status" | "assignedTo">>,
): Promise<void> {
  const { error } = await admin().from("enquiries").update(toSnake(patch)).eq("id", id);
  if (error) fail("updateEnquiry", error);
}

/* -------------------------------------------------------------------------- */
/* SMS log                                                                     */
/* -------------------------------------------------------------------------- */

export async function insertSmsMessages(rows: SmsMessage[]): Promise<void> {
  if (rows.length === 0) return;
  const { error } = await admin().from("sms_messages").insert(rows.map(toSnake));
  if (error) fail("insertSmsMessages", error);
}

export async function listSmsMessages(limit = 20): Promise<SmsMessage[]> {
  const { data, error } = await admin()
    .from("sms_messages").select("*").order("at", { ascending: false }).limit(limit);
  if (error) fail("listSmsMessages", error);
  return (data ?? []).map((r) => toCamel<SmsMessage>(r));
}
