"use server";

import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { after } from "next/server";
import { requireOwner, requireStaff, assertCanWrite, WindowRequiredError } from "@/lib/panel/guard";
import { emailHasAccount, signOut } from "@/lib/panel/auth";
import {
  deleteBookingRow,
  getAccessRequest,
  getBooking,
  getStaff,
  insertAudit,
  insertBooking,
  insertEnquiry,
  insertEnquiryMessage,
  insertStaff,
  insertVehicle,
  newId,
  nextBookingReference,
  updateBooking,
  updateEnquiry,
  updateStaff,
  updateVehicle,
  vehicleSlugExists,
} from "@/lib/panel/db";
import { closeShift, openShift, markAway } from "@/lib/panel/time";
import { closeWindow, redeemCode, requestWindow, scopeLabel } from "@/lib/panel/window";
import { publicCarBySlug, vehicleBySlug } from "@/lib/fleet";
import { deleteDocuments, saveDocument, VALID_SLOTS } from "@/lib/panel/uploads";
import { deleteVehiclePhoto, uploadVehiclePhoto } from "@/lib/panel/vehicle-photos";
import { notifyNewBooking, sendTestSms } from "@/lib/sms/notify";
import { toMsisdn } from "@/lib/sms/textlk";
import { admin } from "@/lib/supabase/admin";
import {
  checkbox,
  clamp,
  featureLines,
  fuelChoice,
  optionalRate,
  plainText,
  tierRates,
} from "@/lib/panel/vehicle-form";
import { RATE_TIERS } from "@/lib/pricing";
import { MAX_VEHICLE_IMAGES } from "@/types";
import type {
  AuditEntry,
  BookingStatus,
  PanelBooking,
  PaymentMethod,
  WindowScope,
} from "@/lib/panel/types";
import type {
  DocumentSlot,
  IdDocumentType,
  UploadedDocument,
} from "@/types/booking";

/**
 * Every mutation in the panel, plus the three public forms.
 *
 * Staff actions re-read the session and re-check permission from the database
 * through the guard. None of them trust a field the browser sent about who
 * the caller is.
 *
 * The public actions (createBookingAction, createEnquiryAction,
 * uploadBookingDocumentAction) are callable by anyone, not only by the forms
 * that use them, so they accept only what a customer can legitimately send and
 * clamp everything else.
 *
 * revalidatePath("/fleet") and friends are what make a change in the panel show
 * up on the public site: mark a vehicle booked here and the customer-facing
 * list drops it on the next request.
 */

function refreshPublicFleet() {
  revalidatePath("/");
  revalidatePath("/fleet");
  revalidatePath("/fleet/[slug]", "page");
  revalidatePath("/booking");
  revalidatePath("/sitemap.xml");
}

async function audit(
  staffId: string,
  action: string,
  entity: AuditEntry["entity"],
  entityId: string,
  summary: string,
  accessRequestId: string | null = null,
) {
  await insertAudit({ staffId, action, entity, entityId, summary, accessRequestId });
}

/** Runs the write gate and turns a missing window into a readable redirect. */
async function gate(
  user: Awaited<ReturnType<typeof requireStaff>>,
  scope: WindowScope,
  targetSlug: string | null,
  back: string,
  message: string,
): Promise<string | null> {
  try {
    return await assertCanWrite(user, scope, targetSlug);
  } catch (error) {
    if (error instanceof WindowRequiredError) {
      redirect(`${back}?error=${encodeURIComponent(message)}`);
    }
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/* Session                                                                     */
/* -------------------------------------------------------------------------- */

export async function signOutAction() {
  const user = await requireStaff();
  await closeShift(user, "manual_signout");
  await signOut();
  redirect("/999p7k");
}

export async function clockInAction() {
  const user = await requireStaff();
  await openShift(user);
  revalidatePath("/panel", "layout");
}

export async function clockOutAction() {
  const user = await requireStaff();
  await closeShift(user, "manual_signout");
  revalidatePath("/panel", "layout");
}

export async function awayAction() {
  const user = await requireStaff();
  await markAway(user, "browser_closed");
}

/* -------------------------------------------------------------------------- */
/* The write window                                                            */
/* -------------------------------------------------------------------------- */

const SCOPE_IDS: WindowScope[] = [
  "fleet.create", "fleet.update", "fleet.delete", "fleet.photos", "pricing.update", "booking.delete",
];

export async function requestWindowAction(formData: FormData) {
  const user = await requireStaff();
  const scope = String(formData.get("scope") ?? "") as WindowScope;
  if (!SCOPE_IDS.includes(scope)) return;
  const reason = String(formData.get("reason") ?? "");
  const target = String(formData.get("target") ?? "").trim();

  await requestWindow(user, scope, reason, target.length > 0 ? target : null);
  revalidatePath("/panel", "layout");
}

export async function redeemCodeAction(formData: FormData) {
  const user = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "");
  const code = String(formData.get("code") ?? "");

  const result = await redeemCode(user, requestId, code);
  revalidatePath("/panel", "layout");

  if (!result.ok) {
    redirect(`/panel/fleet?error=${encodeURIComponent(result.error ?? "Wrong code")}`);
  }
}

export async function closeWindowAction(formData: FormData) {
  const user = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "");

  const request = await getAccessRequest(requestId);
  if (!request) return;

  // The owner may revoke anyone's window. An employee may only close their own.
  if (user.role !== "owner" && request.staffId !== user.id) return;

  await closeWindow(
    requestId,
    user.role === "owner" && request.staffId !== user.id ? "revoked by owner" : "finished",
    user.id,
  );
  revalidatePath("/panel", "layout");
}

/* -------------------------------------------------------------------------- */
/* Fleet                                                                       */
/* -------------------------------------------------------------------------- */

/** Mark a vehicle booked or free. This is what hides it from the public site. */
export async function setVehicleAvailabilityAction(formData: FormData) {
  const user = await requireStaff();
  const slug = String(formData.get("slug") ?? "");
  const available = String(formData.get("available") ?? "") === "true";

  // Availability is day-to-day booking work, not an edit to the vehicle, so it
  // deliberately does NOT need a window. Confirming a booking has to be
  // possible the moment the phone rings.
  const vehicle = await vehicleBySlug(slug);
  if (!vehicle) return;

  await updateVehicle(slug, { available });
  await audit(
    user.id,
    available ? "vehicle.freed" : "vehicle.booked",
    "vehicle",
    slug,
    available
      ? `Marked ${vehicle.car.name} available again`
      : `Marked ${vehicle.car.name} booked, hidden from the website`,
  );

  refreshPublicFleet();
  revalidatePath("/panel/fleet");
}

export async function updateVehicleAction(formData: FormData) {
  const user = await requireStaff();
  const slug = String(formData.get("slug") ?? "");

  const vehicle = await vehicleBySlug(slug);
  if (!vehicle) return;

  const num = (key: string, fallback: number) => {
    const raw = formData.get(key);
    const parsed = Number(raw);
    return raw === null || raw === "" || Number.isNaN(parsed) ? fallback : parsed;
  };

  // A locked fieldset submits none of its controls, so an absent key means
  // "not offered to this user", not "cleared". Those keep the current value;
  // a present but empty key is a deliberate clear.
  const keep = <T,>(key: string, current: T, parse: () => T): T =>
    formData.get(key) === null ? current : parse();

  const next = {
    name: plainText(formData.get("name") ?? vehicle.car.name, 80) || vehicle.car.name,
    tagline: keep("tagline", vehicle.car.tagline, () => plainText(formData.get("tagline"), 140)),
    description: keep("description", vehicle.car.description, () =>
      plainText(formData.get("description"), 1200),
    ),
    features: keep("features", vehicle.car.features, () => featureLines(formData.get("features"))),
    seats: clamp(num("seats", vehicle.car.specs.seats), 1, 60),
    doors: clamp(num("doors", vehicle.car.specs.doors), 1, 8),
    fuel: keep("fuel", vehicle.car.specs.fuel, () => fuelChoice(formData.get("fuel"))),
    // A checkbox submits nothing when unchecked, so this cannot use keep():
    // an absent key here means "cleared". The whole fieldset is only rendered
    // to someone who may edit it, so there is no locked-form case to protect.
    hybrid: checkbox(formData.get("hybrid")),
    daily: clamp(num("daily", vehicle.car.pricing.daily), 0, 10_000_000),
    deposit: clamp(num("deposit", vehicle.car.pricing.deposit), 0, 10_000_000),
    // Blank or zero means no rate set, which the vehicle page shows as "ask
    // us". Absent (a locked fieldset) keeps the current rate.
    extraKm: keep("extraKm", vehicle.car.pricing.extraKm, () => optionalRate(formData.get("extraKm"))),
    featured: formData.get("featured") === "on",
  };
  const tiers = tierRates(formData, next.daily, vehicle.car.pricing.tiers);

  const changedTiers = RATE_TIERS.filter(
    (tier) => tiers[tier.id] !== vehicle.car.pricing.tiers[tier.id],
  );

  const pricingChanged =
    next.daily !== vehicle.car.pricing.daily ||
    changedTiers.length > 0 ||
    next.deposit !== vehicle.car.pricing.deposit ||
    next.extraKm !== vehicle.car.pricing.extraKm;

  // Pricing has its own scope, so an employee given a photo window cannot
  // quietly change the rates.
  const scope: WindowScope = pricingChanged ? "pricing.update" : "fleet.update";
  const requestId = await gate(
    user, scope, slug, `/panel/fleet/${slug}`,
    `You need an open window for ${scopeLabel(scope)} to save that.`,
  );

  const before = vehicle.car;
  await updateVehicle(slug, { ...next, tiers });

  const changes: string[] = [];
  if (next.name !== before.name) changes.push(`name to ${next.name}`);
  if (next.tagline !== before.tagline) changes.push("tagline");
  if (next.description !== before.description) changes.push("the description");
  if (next.features.join("|") !== before.features.join("|"))
    changes.push(`features to ${next.features.length} item${next.features.length === 1 ? "" : "s"}`);
  if (next.seats !== before.specs.seats) changes.push(`seats to ${next.seats}`);
  if (next.doors !== before.specs.doors) changes.push(`doors to ${next.doors}`);
  if (next.fuel !== before.specs.fuel) changes.push(`fuel to ${next.fuel}`);
  if (next.hybrid !== before.specs.hybrid)
    changes.push(next.hybrid ? "marked hybrid" : "no longer hybrid");
  if (next.daily !== before.pricing.daily)
    changes.push(`daily ${before.pricing.daily} to ${next.daily}`);
  for (const tier of changedTiers)
    changes.push(`${tier.label} rate ${before.pricing.tiers[tier.id]} to ${tiers[tier.id]} a day`);
  if (next.deposit !== before.pricing.deposit)
    changes.push(`deposit ${before.pricing.deposit} to ${next.deposit}`);
  if (next.extraKm !== before.pricing.extraKm)
    changes.push(`extra km rate ${before.pricing.extraKm ?? "unset"} to ${next.extraKm ?? "unset"}`);
  if (next.featured !== before.featured)
    changes.push(next.featured ? "featured on the home page" : "unfeatured");

  await audit(
    user.id,
    "vehicle.updated",
    "vehicle",
    slug,
    changes.length > 0 ? `Edited ${before.name}: ${changes.join(", ")}` : `Saved ${before.name} with no changes`,
    requestId,
  );

  refreshPublicFleet();
  revalidatePath(`/panel/fleet/${slug}`);
  redirect(`/panel/fleet/${slug}?saved=1`);
}

export async function createVehicleAction(formData: FormData) {
  const user = await requireStaff();
  const requestId = await gate(
    user, "fleet.create", null, "/panel/fleet", "You need an open window to add a vehicle.",
  );

  const name = plainText(formData.get("name"), 80);
  if (name.length === 0) {
    redirect(`/panel/fleet?error=${encodeURIComponent("A vehicle needs a name.")}`);
  }

  const slugBase =
    name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "vehicle";
  let slug = slugBase;
  for (let n = 2; await vehicleSlugExists(slug); n++) slug = `${slugBase}-${n}`;

  const num = (key: string, fallback: number) => {
    const parsed = Number(formData.get(key));
    return Number.isNaN(parsed) || parsed === 0 ? fallback : parsed;
  };

  const daily = clamp(num("daily", 8000), 0, 10_000_000);

  await insertVehicle({
    slug,
    name,
    brand: plainText(formData.get("brand"), 40) || name.split(" ")[0],
    year: clamp(num("year", new Date().getFullYear()), 1950, 2100),
    category: String(formData.get("category") ?? "hatchback"),
    tagline: plainText(formData.get("tagline"), 140),
    description: plainText(formData.get("description"), 1200),
    features: featureLines(formData.get("features")),
    seats: clamp(num("seats", 5), 1, 60),
    doors: clamp(num("doors", 5), 1, 8),
    luggage: clamp(num("luggage", 2), 0, 20),
    transmission: String(formData.get("transmission") ?? "automatic") === "manual" ? "manual" : "automatic",
    fuel: fuelChoice(formData.get("fuel")),
    hybrid: checkbox(formData.get("hybrid")),
    engineCc: clamp(num("engineCc", 1500), 0, 10000),
    daily,
    // Left blank, a long-hire rate is suggested from the daily one, so a
    // hurried add still produces a complete rate table.
    tiers: tierRates(formData, daily),
    deposit: clamp(num("deposit", 30000), 0, 10_000_000),
    extraKm: optionalRate(formData.get("extraKm")),
    withDriverDaily: optionalRate(formData.get("withDriverDaily")),
    // Photos arrive with Cloudinary upload. Until then a vehicle shows an
    // honest placeholder tile; see SafeImage.
    images: [],
    available: true,
    featured: false,
    createdBy: user.id,
    deletedAt: null,
  });

  await audit(user.id, "vehicle.created", "vehicle", slug, `Added ${name}`, requestId);
  refreshPublicFleet();
  revalidatePath("/panel/fleet");
  redirect(`/panel/fleet/${slug}?saved=1`);
}

export async function deleteVehicleAction(formData: FormData) {
  const user = await requireStaff();
  const slug = String(formData.get("slug") ?? "");
  const restore = String(formData.get("restore") ?? "") === "true";

  const vehicle = await vehicleBySlug(slug);
  if (!vehicle) return;

  const requestId = await gate(
    user, "fleet.delete", slug, "/panel/fleet", "You need an open window to remove a vehicle.",
  );

  await updateVehicle(slug, { deletedAt: restore ? null : new Date().toISOString() });
  await audit(
    user.id,
    restore ? "vehicle.restored" : "vehicle.deleted",
    "vehicle",
    slug,
    restore ? `Restored ${vehicle.car.name}` : `Removed ${vehicle.car.name}`,
    requestId,
  );

  refreshPublicFleet();
  revalidatePath("/panel/fleet");
}

/* -------------------------------------------------------------------------- */
/* Vehicle photographs                                                         */
/* -------------------------------------------------------------------------- */

/**
 * Photos have their own scope, `fleet.photos`, so an employee can be trusted
 * with pictures without being handed the rates. The vehicle's `images` column
 * holds Cloudinary public ids, in display order; the first is the card shot.
 */
export async function addVehiclePhotoAction(formData: FormData) {
  const user = await requireStaff();
  const slug = String(formData.get("slug") ?? "");
  const back = `/panel/fleet/${slug}`;

  const vehicle = await vehicleBySlug(slug);
  if (!vehicle) return;

  const requestId = await gate(
    user, "fleet.photos", slug, back, "You need an open window for photos to change them.",
  );

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    redirect(`${back}?error=${encodeURIComponent("Choose a photo first.")}`);
  }
  if (vehicle.car.images.length >= MAX_VEHICLE_IMAGES) {
    redirect(`${back}?error=${encodeURIComponent(`${MAX_VEHICLE_IMAGES} photos is the limit. Remove one first.`)}`);
  }

  const result = await uploadVehiclePhoto(file, slug);
  if (!result.ok) {
    redirect(`${back}?error=${encodeURIComponent(result.error)}`);
  }

  await updateVehicle(slug, { images: [...vehicle.car.images, result.publicId] });
  await audit(
    user.id, "vehicle.photo_added", "vehicle", slug,
    `Added a photo to ${vehicle.car.name} (${vehicle.car.images.length + 1} of ${MAX_VEHICLE_IMAGES})`,
    requestId,
  );

  refreshPublicFleet();
  revalidatePath(back);
  redirect(`${back}?saved=1`);
}

export async function removeVehiclePhotoAction(formData: FormData) {
  const user = await requireStaff();
  const slug = String(formData.get("slug") ?? "");
  const publicId = String(formData.get("publicId") ?? "");
  const back = `/panel/fleet/${slug}`;

  const vehicle = await vehicleBySlug(slug);
  if (!vehicle || !vehicle.car.images.includes(publicId)) return;

  const requestId = await gate(
    user, "fleet.photos", slug, back, "You need an open window for photos to change them.",
  );

  // The row first: staff asked for it off the site, and that must happen even
  // if Cloudinary is briefly unreachable. A failed delete is logged, and the
  // file is then unreferenced rather than shown.
  await updateVehicle(slug, { images: vehicle.car.images.filter((id) => id !== publicId) });
  if (!(await deleteVehiclePhoto(publicId))) {
    console.error(`[photos] ${publicId} removed from ${slug} but not deleted at Cloudinary`);
  }

  await audit(user.id, "vehicle.photo_removed", "vehicle", slug, `Removed a photo from ${vehicle.car.name}`, requestId);
  refreshPublicFleet();
  revalidatePath(back);
}

/** Move one photo to the front: it becomes the card and gallery shot. */
export async function makePhotoPrimaryAction(formData: FormData) {
  const user = await requireStaff();
  const slug = String(formData.get("slug") ?? "");
  const publicId = String(formData.get("publicId") ?? "");
  const back = `/panel/fleet/${slug}`;

  const vehicle = await vehicleBySlug(slug);
  if (!vehicle || !vehicle.car.images.includes(publicId)) return;

  const requestId = await gate(
    user, "fleet.photos", slug, back, "You need an open window for photos to change them.",
  );

  await updateVehicle(slug, {
    images: [publicId, ...vehicle.car.images.filter((id) => id !== publicId)],
  });
  await audit(user.id, "vehicle.photo_primary", "vehicle", slug, `Changed the main photo of ${vehicle.car.name}`, requestId);

  refreshPublicFleet();
  revalidatePath(back);
}

/* -------------------------------------------------------------------------- */
/* Bookings                                                                    */
/* -------------------------------------------------------------------------- */

const STATUSES: BookingStatus[] = ["pending", "confirmed", "on_hire", "returned", "cancelled"];
const PAYMENT_METHODS: PaymentMethod[] = ["unpaid", "cash", "bank_transfer", "card_on_pickup"];

export async function setBookingStatusAction(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as BookingStatus;
  if (!STATUSES.includes(status)) return;

  const booking = await getBooking(id);
  if (!booking) return;

  // Starts the retention clock for the ID photos (lib/panel/retention-rules).
  // Reopening a closed booking stops it again.
  const closing = status === "returned" || status === "cancelled";
  await updateBooking(id, {
    status,
    handledBy: user.id,
    closedAt: closing ? (booking.closedAt ?? new Date().toISOString()) : null,
  });

  // Confirming or starting a hire takes the vehicle off the website.
  // Cancelling or returning puts it back.
  if (booking.carSlug) {
    const held = status === "confirmed" || status === "on_hire";
    await updateVehicle(booking.carSlug, { available: !held });
  }

  await audit(user.id, "booking.status", "booking", id, `${booking.reference} set to ${status.replace("_", " ")}`);

  refreshPublicFleet();
  revalidatePath("/panel/bookings");
  revalidatePath("/panel");
}

export async function setBookingPaymentAction(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const method = String(formData.get("method") ?? "unpaid") as PaymentMethod;
  if (!PAYMENT_METHODS.includes(method)) return;
  const amount = clamp(Math.round(Number(formData.get("amount") ?? 0) || 0), 0, 100_000_000);

  if (!(await getBooking(id))) return;
  await updateBooking(id, { paymentMethod: method, amount, handledBy: user.id });

  await audit(user.id, "booking.payment", "booking", id, `Recorded ${method.replace("_", " ")} ${amount}`);
  revalidatePath("/panel/bookings");
  revalidatePath("/panel");
}

/**
 * The identity numbers typed at handover, and the retention hold.
 *
 * The numbers are what keep a past customer identifiable once the photos are
 * deleted. The hold stops that deletion while a fine, damage claim or dispute
 * is open. Any staff member may set both: this is handover work, not an edit
 * to shared fleet data, so it needs no window.
 */
export async function setBookingIdentityAction(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const idNumber = plainText(formData.get("idNumber"), 40);
  const licenceNumber = plainText(formData.get("licenceNumber"), 40);
  // A checkbox posts nothing when unticked, so absent means off.
  const documentsHold = checkbox(formData.get("documentsHold"));

  const before = await getBooking(id);
  if (!before) return;

  await updateBooking(id, { idNumber, licenceNumber, documentsHold });

  const changes: string[] = [];
  if (idNumber !== before.idNumber) changes.push("ID number");
  if (licenceNumber !== before.licenceNumber) changes.push("licence number");
  if (documentsHold !== before.documentsHold)
    changes.push(documentsHold ? "photos put on hold" : "hold released");
  if (changes.length > 0) {
    // The numbers themselves stay out of the audit log: it is shown on a
    // screen, and it is not the place to copy identity numbers into.
    await audit(user.id, "booking.identity", "booking", id, `${before.reference}: ${changes.join(", ")}`);
  }
  revalidatePath("/panel/bookings");
}

export async function deleteBookingAction(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");

  const requestId = await gate(
    user, "booking.delete", null, "/panel/bookings", "You need an open window to delete a booking.",
  );

  const booking = await getBooking(id);
  if (!booking) return;

  // The photos go with the record, and first: deleteDocuments throws on a
  // storage error, so the record is never removed while its photos remain.
  await deleteDocuments(booking.documents.map((d) => d.id));
  await deleteBookingRow(id);

  await audit(user.id, "booking.deleted", "booking", id, `Deleted booking ${booking.reference}`, requestId);
  revalidatePath("/panel/bookings");
}

/* -------------------------------------------------------------------------- */
/* Public: the booking form                                                    */
/* -------------------------------------------------------------------------- */

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DOCUMENT_ID = /^[0-9a-f]{32}$/;

/** A real calendar date in YYYY-MM-DD, or null. */
function isoDate(value: unknown): string | null {
  const text = String(value ?? "");
  if (!DATE.test(text)) return null;
  const [y, m, d] = text.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d
    ? text
    : null;
}

/**
 * Only well-formed metadata for real slots, at most one per slot. The bytes
 * were already checked when they were uploaded; this stops a caller attaching
 * junk, or twenty entries, to a booking.
 */
function cleanDocuments(input: unknown): UploadedDocument[] {
  if (!Array.isArray(input)) return [];
  const seen = new Set<DocumentSlot>();
  const out: UploadedDocument[] = [];
  for (const raw of input.slice(0, VALID_SLOTS.length)) {
    const d = raw as Partial<UploadedDocument>;
    if (typeof d?.id !== "string" || !DOCUMENT_ID.test(d.id)) continue;
    if (!d.slot || !VALID_SLOTS.includes(d.slot) || seen.has(d.slot)) continue;
    seen.add(d.slot);
    out.push({
      id: d.id,
      slot: d.slot,
      fileName: plainText(d.fileName ?? "upload", 80) || "upload",
      contentType: plainText(d.contentType ?? "", 40),
      size: clamp(Math.round(Number(d.size) || 0), 0, 8 * 1024 * 1024),
      uploadedAt:
        typeof d.uploadedAt === "string" && !Number.isNaN(Date.parse(d.uploadedAt))
          ? d.uploadedAt
          : new Date().toISOString(),
    });
  }
  return out;
}

/**
 * PUBLIC. Called by the booking form, and callable by anyone who looks, so it
 * trusts nothing it is sent beyond what a customer may choose.
 */
export async function createBookingAction(input: {
  carSlug: string | null;
  customerName: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  idType?: IdDocumentType;
  documents?: UploadedDocument[];
  pickupLocation?: string;
  pickupDate: string;
  returnDate: string;
  withDriver?: boolean;
  notes?: string;
  amount?: number;
  source?: "website" | "panel";
}): Promise<string> {
  const pickupDate = isoDate(input.pickupDate);
  const returnDate = isoDate(input.returnDate);
  if (!pickupDate || !returnDate || returnDate < pickupDate) {
    throw new Error("Those dates are not valid. Check the pickup and return dates.");
  }

  // Only a vehicle a customer could actually see. Anything else is saved with
  // no vehicle rather than failing the booking, and staff sort it out.
  const car = input.carSlug ? await publicCarBySlug(String(input.carSlug)) : null;

  const booking: PanelBooking = {
    id: newId("bk"),
    reference: await nextBookingReference(),
    carSlug: car?.slug ?? null,
    customerName: plainText(input.customerName, 120) || "No name given",
    phone: plainText(input.phone, 40),
    whatsapp: plainText(input.whatsapp ?? "", 40),
    email: plainText(input.email ?? "", 160),
    pickupLocation: plainText(input.pickupLocation ?? "", 160) || "Heiyanthuduwa office",
    pickupDate,
    returnDate,
    withDriver: input.withDriver === true,
    notes: plainText(input.notes ?? "", 1000),
    status: "pending",
    paymentMethod: "unpaid",
    // The customer's estimate, shown to staff as a starting point. Staff
    // record the real amount when payment is taken.
    amount: clamp(Math.round(Number(input.amount) || 0), 0, 100_000_000),
    createdAt: new Date().toISOString(),
    handledBy: null,
    // A public caller is always the website. "panel" is not theirs to claim.
    source: "website",
    idType: input.idType === "passport" ? "passport" : "nic",
    documents: cleanDocuments(input.documents),
    idNumber: "",
    licenceNumber: "",
    closedAt: null,
    documentsHold: false,
    documentsPurgedAt: null,
  };

  await insertBooking(booking);

  // Text the owner and the staff, after the response has gone back.
  //
  // after() rather than await: the booking is already saved, so the customer
  // should see "request sent" immediately instead of waiting on an SMS gateway.
  // Nothing in notifyNewBooking() throws.
  after(async () => {
    await notifyNewBooking(booking, car?.name ?? null);
  });

  revalidatePath("/panel/bookings");
  revalidatePath("/panel");
  return booking.reference;
}

/* -------------------------------------------------------------------------- */
/* Enquiries                                                                   */
/* -------------------------------------------------------------------------- */

export async function replyToEnquiryAction(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const body = plainText(formData.get("body"), 2000);
  if (body.length === 0) return;

  await insertEnquiryMessage(id, { id: newId("msg"), at: new Date().toISOString(), fromStaffId: user.id, body });
  await updateEnquiry(id, { status: "answered", assignedTo: user.id });

  // Counting replies is only possible because they happen in here. See the
  // plan, section 8.
  await audit(user.id, "enquiry.replied", "enquiry", id, "Replied to an enquiry");
  revalidatePath("/panel/enquiries");
  revalidatePath("/panel");
}

export async function closeEnquiryAction(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");

  await updateEnquiry(id, { status: "closed" });
  await audit(user.id, "enquiry.closed", "enquiry", id, "Closed an enquiry");
  revalidatePath("/panel/enquiries");
}

/** PUBLIC. The contact form. */
export async function createEnquiryAction(input: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
}) {
  const body = plainText(input.body, 4000);
  if (body.length === 0) throw new Error("The message is empty.");

  const at = new Date().toISOString();
  const id = newId("enq");
  await insertEnquiry(
    {
      id,
      name: plainText(input.name, 120) || "No name given",
      email: plainText(input.email, 160),
      phone: plainText(input.phone, 40),
      subject: plainText(input.subject, 160),
      createdAt: at,
      status: "open",
      assignedTo: null,
    },
    { id: newId("msg"), at, fromStaffId: null, body },
  );
  revalidatePath("/panel/enquiries");
}

/* -------------------------------------------------------------------------- */
/* Staff, owner only                                                           */
/* -------------------------------------------------------------------------- */

/**
 * The new account's one-time password travels to the team page in this
 * short-lived cookie, never in a URL (which lands in logs and history) and
 * never in the database. It is httpOnly, scoped to /panel/team, and gone after
 * five minutes or when the owner dismisses it.
 */
const NEW_STAFF_COOKIE = "ec_new_staff";

/** Ten characters, no lookalikes (no 0/o, 1/l/i). Cryptographically random. */
function oneTimePassword(): string {
  const alphabet = "abcdefghjkmnpqrstuvwxyz23456789";
  return Array.from({ length: 10 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");
}

export async function createStaffAction(formData: FormData) {
  const owner = await requireOwner();
  const name = plainText(formData.get("name"), 80);
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const phone = plainText(formData.get("phone"), 40);

  if (name.length === 0 || email.length === 0) {
    redirect(`/panel/team?error=${encodeURIComponent("Name and email are both needed.")}`);
  }
  if (await emailHasAccount(email)) {
    redirect(`/panel/team?error=${encodeURIComponent("That email already has an account.")}`);
  }
  // Optional, but if one is typed it has to be a real number. Saving a broken
  // one looks like it worked and then silently never sends.
  if (phone.length > 0 && toMsisdn(phone) === null) {
    redirect(`/panel/team?error=${encodeURIComponent(`"${phone}" is not a Sri Lankan mobile number.`)}`);
  }

  // The one-time password the client chose: generated, shown once, handed
  // over in person. It lives only in Supabase Auth, as a hash.
  const password = oneTimePassword();
  const { data, error } = await admin().auth.admin.createUser({ email, password, email_confirm: true });
  if (error || !data.user) {
    redirect(`/panel/team?error=${encodeURIComponent(`Could not create the login: ${error?.message ?? "unknown error"}`)}`);
  }
  const id = data.user.id;

  try {
    await insertStaff({ id, name, email, role: "employee", active: true, phone, smsAlerts: true });
  } catch (insertError) {
    // No staff row means a login that can never get in. Remove it rather than
    // leave an orphan in Supabase Auth.
    await admin().auth.admin.deleteUser(id);
    throw insertError;
  }

  const jar = await cookies();
  jar.set(NEW_STAFF_COOKIE, JSON.stringify({ id, name, email, password }), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/panel/team",
    maxAge: 5 * 60,
  });

  await audit(owner.id, "staff.created", "staff", id, `Created an account for ${name}`);
  revalidatePath("/panel/team");
  redirect("/panel/team");
}

/** Forget the one-time password now it has been handed over. */
export async function dismissOneTimePasswordAction() {
  await requireOwner();
  const jar = await cookies();
  jar.delete({ name: NEW_STAFF_COOKIE, path: "/panel/team" });
  revalidatePath("/panel/team");
}

/**
 * Set or clear the number a person's booking alerts go to.
 *
 * The typed form is what gets stored, so the owner reads back what he entered.
 * toMsisdn() is only used to reject nonsense here and to normalise at send
 * time. An empty box is a legitimate value: it means stop texting this person.
 */
export async function setStaffPhoneAction(formData: FormData) {
  const owner = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const phone = plainText(formData.get("phone"), 40);

  if (phone.length > 0 && toMsisdn(phone) === null) {
    redirect(`/panel/team?error=${encodeURIComponent(`"${phone}" is not a Sri Lankan mobile number.`)}`);
  }

  const target = await getStaff(id);
  if (!target) return;
  await updateStaff(id, { phone });

  // The number itself is not written into the audit summary. It is a personal
  // detail and the log is read by both employees.
  await audit(
    owner.id,
    phone.length > 0 ? "staff.phone_set" : "staff.phone_cleared",
    "staff",
    id,
    `${phone.length > 0 ? "Set" : "Cleared"} the alert number for ${target.name}`,
  );
  revalidatePath("/panel/team");
}

export async function setStaffAlertsAction(formData: FormData) {
  const owner = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const on = String(formData.get("on") ?? "") === "true";

  const target = await getStaff(id);
  if (!target) return;
  await updateStaff(id, { smsAlerts: on });

  await audit(
    owner.id,
    on ? "staff.alerts_on" : "staff.alerts_off",
    "staff",
    id,
    `Turned booking alerts ${on ? "on" : "off"} for ${target.name}`,
  );
  revalidatePath("/panel/team");
}

/**
 * Send one real text to one person.
 *
 * Awaited, not deferred with after(): the whole point is to stand there and
 * find out whether it worked, so the result has to be recorded before the page
 * re-renders.
 */
export async function sendTestSmsAction(formData: FormData) {
  const owner = await requireOwner();
  const id = String(formData.get("id") ?? "");

  const target = await getStaff(id);
  const msisdn = toMsisdn(target?.phone ?? "");
  if (!target || msisdn === null) {
    redirect(`/panel/team?error=${encodeURIComponent("Save a valid mobile number first.")}`);
  }

  const row = await sendTestSms({ staffId: target.id, name: target.name, msisdn });

  await audit(
    owner.id,
    "sms.test_sent",
    "staff",
    id,
    `Sent a test message to ${target.name} (${row?.status ?? "unknown"})`,
  );
  revalidatePath("/panel/team");
}

export async function setStaffActiveAction(formData: FormData) {
  const owner = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  if (id === owner.id) return; // never lock yourself out

  const target = await getStaff(id);
  if (!target) return;
  // Takes effect on their next click: getCurrentUser refuses an inactive row
  // even while their Supabase session is still valid.
  await updateStaff(id, { active });

  await audit(
    owner.id,
    active ? "staff.enabled" : "staff.disabled",
    "staff",
    id,
    `${active ? "Enabled" : "Disabled"} ${target.name}`,
  );
  revalidatePath("/panel/team");
}

/* -------------------------------------------------------------------------- */
/* Public: identity document upload                                            */
/* -------------------------------------------------------------------------- */

/**
 * One identity document from the public booking form.
 *
 * DELIBERATELY UNAUTHENTICATED: the person uploading is a customer who has no
 * account and never will. The protection is therefore on the content and not
 * on the caller, and it all lives in lib/panel/uploads.ts: an 8MB cap, and an
 * allowlist checked against the file's magic numbers rather than the
 * Content-Type the browser claims. The private bucket enforces both again.
 *
 * Returns an id. Reading that id back requires a staff session, which is what
 * keeps a write-only drop from becoming a public file host. An upload no
 * booking claims is deleted after a day (retention.ts, purgeOrphanUploads).
 */
export async function uploadBookingDocumentAction(
  formData: FormData,
): Promise<{ ok: true; document: UploadedDocument } | { ok: false; error: string }> {
  const file = formData.get("file");
  const slot = String(formData.get("slot") ?? "") as DocumentSlot;

  if (!(file instanceof File)) {
    return { ok: false, error: "No file was received. Try again." };
  }

  return saveDocument(file, slot);
}
