"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireOwner, requireStaff, assertCanWrite, WindowRequiredError } from "@/lib/panel/guard";
import { SESSION_COOKIE } from "@/lib/panel/auth";
import { hashPassword, newId, readData, writeData } from "@/lib/panel/store";
import { closeShift, openShift, markAway } from "@/lib/panel/time";
import { closeWindow, redeemCode, requestWindow, scopeLabel } from "@/lib/panel/window";
import { vehicleBySlug } from "@/lib/fleet";
import type {
  BookingStatus,
  PanelBooking,
  PaymentMethod,
  WindowScope,
} from "@/lib/panel/types";

/**
 * Every mutation in the panel.
 *
 * All of them re-read the session and re-check permission from the store. None
 * of them trust a field the browser sent about who the caller is.
 *
 * revalidatePath("/fleet") and friends are what make a change in the panel show
 * up on the public site: mark a vehicle booked here and the customer-facing
 * list drops it on the next request.
 */

/** Keeps a typed-in spec inside something a real vehicle could have. */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, Math.round(value)));
}

function refreshPublicFleet() {
  revalidatePath("/");
  revalidatePath("/fleet");
  revalidatePath("/fleet/[slug]", "page");
  revalidatePath("/booking");
  revalidatePath("/sitemap.xml");
}

function audit(
  staffId: string,
  action: string,
  entity: "vehicle" | "booking" | "enquiry" | "staff" | "access" | "shift",
  entityId: string,
  summary: string,
  accessRequestId: string | null = null,
) {
  writeData((data) => {
    data.audit.push({
      id: newId("aud"),
      at: new Date().toISOString(),
      staffId,
      action,
      entity,
      entityId,
      summary,
      accessRequestId,
    });
  });
}

/* -------------------------------------------------------------------------- */
/* Session                                                                     */
/* -------------------------------------------------------------------------- */

export async function signOutAction() {
  const user = await requireStaff();
  closeShift(user.id, "manual_signout");
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/999p7k");
}

export async function clockInAction() {
  const user = await requireStaff();
  openShift(user.id);
  revalidatePath("/panel", "layout");
}

export async function clockOutAction() {
  const user = await requireStaff();
  closeShift(user.id, "manual_signout");
  revalidatePath("/panel", "layout");
}

export async function awayAction() {
  const user = await requireStaff();
  markAway(user.id, "browser_closed");
}

/* -------------------------------------------------------------------------- */
/* The write window                                                            */
/* -------------------------------------------------------------------------- */

export async function requestWindowAction(formData: FormData) {
  const user = await requireStaff();
  const scope = String(formData.get("scope") ?? "") as WindowScope;
  const reason = String(formData.get("reason") ?? "");
  const target = String(formData.get("target") ?? "").trim();

  requestWindow(user, scope, reason, target.length > 0 ? target : null);
  revalidatePath("/panel", "layout");
}

export async function redeemCodeAction(formData: FormData) {
  const user = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "");
  const code = String(formData.get("code") ?? "");

  const result = redeemCode(user, requestId, code);
  revalidatePath("/panel", "layout");

  if (!result.ok) {
    redirect(`/panel/fleet?error=${encodeURIComponent(result.error ?? "Wrong code")}`);
  }
}

export async function closeWindowAction(formData: FormData) {
  const user = await requireStaff();
  const requestId = String(formData.get("requestId") ?? "");

  const request = readData().accessRequests.find((r) => r.id === requestId);
  if (!request) return;

  // The owner may revoke anyone's window. An employee may only close their own.
  if (user.role !== "owner" && request.staffId !== user.id) return;

  closeWindow(
    requestId,
    user.role === "owner" && request.staffId !== user.id
      ? "revoked by owner"
      : "finished",
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

  writeData((data) => {
    const current = data.vehicleOverrides[slug] ?? {};
    data.vehicleOverrides[slug] = { ...current, available };
  });

  audit(
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

  const next = {
    name: String(formData.get("name") ?? vehicle.car.name).trim(),
    seats: clamp(num("seats", vehicle.car.specs.seats), 1, 60),
    doors: clamp(num("doors", vehicle.car.specs.doors), 1, 8),
    daily: num("daily", vehicle.car.pricing.daily),
    weekly: num("weekly", vehicle.car.pricing.weekly),
    monthly: num("monthly", vehicle.car.pricing.monthly),
    deposit: num("deposit", vehicle.car.pricing.deposit),
    featured: formData.get("featured") === "on",
  };

  const pricingChanged =
    next.daily !== vehicle.car.pricing.daily ||
    next.weekly !== vehicle.car.pricing.weekly ||
    next.monthly !== vehicle.car.pricing.monthly ||
    next.deposit !== vehicle.car.pricing.deposit;

  // Pricing has its own scope, so an employee given a photo window cannot
  // quietly change the rates.
  let requestId: string | null = null;
  try {
    requestId = assertCanWrite(
      user,
      pricingChanged ? "pricing.update" : "fleet.update",
      slug,
    );
  } catch (error) {
    if (error instanceof WindowRequiredError) {
      redirect(
        `/panel/fleet/${slug}?error=${encodeURIComponent(
          `You need an open window for ${scopeLabel(error.scope)} to save that.`,
        )}`,
      );
    }
    throw error;
  }

  const before = vehicle.car;
  writeData((data) => {
    const current = data.vehicleOverrides[slug] ?? {};
    data.vehicleOverrides[slug] = { ...current, ...next };
  });

  const changes: string[] = [];
  if (next.name !== before.name) changes.push(`name to ${next.name}`);
  if (next.seats !== before.specs.seats) changes.push(`seats to ${next.seats}`);
  if (next.doors !== before.specs.doors) changes.push(`doors to ${next.doors}`);
  if (next.daily !== before.pricing.daily)
    changes.push(`daily ${before.pricing.daily} to ${next.daily}`);
  if (next.weekly !== before.pricing.weekly)
    changes.push(`weekly ${before.pricing.weekly} to ${next.weekly}`);
  if (next.monthly !== before.pricing.monthly)
    changes.push(`monthly ${before.pricing.monthly} to ${next.monthly}`);
  if (next.deposit !== before.pricing.deposit)
    changes.push(`deposit ${before.pricing.deposit} to ${next.deposit}`);
  if (next.featured !== before.featured)
    changes.push(next.featured ? "featured on the home page" : "unfeatured");

  audit(
    user.id,
    "vehicle.updated",
    "vehicle",
    slug,
    changes.length > 0
      ? `Edited ${before.name}: ${changes.join(", ")}`
      : `Saved ${before.name} with no changes`,
    requestId,
  );

  refreshPublicFleet();
  revalidatePath(`/panel/fleet/${slug}`);
  redirect(`/panel/fleet/${slug}?saved=1`);
}

export async function createVehicleAction(formData: FormData) {
  const user = await requireStaff();

  let requestId: string | null = null;
  try {
    requestId = assertCanWrite(user, "fleet.create");
  } catch (error) {
    if (error instanceof WindowRequiredError) {
      redirect(
        `/panel/fleet?error=${encodeURIComponent("You need an open window to add a vehicle.")}`,
      );
    }
    throw error;
  }

  const name = String(formData.get("name") ?? "").trim();
  if (name.length === 0) {
    redirect(`/panel/fleet?error=${encodeURIComponent("A vehicle needs a name.")}`);
  }

  const slugBase = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  const existing = readData().createdVehicles.map((v) => v.slug);
  let slug = slugBase;
  let n = 2;
  while (existing.includes(slug)) slug = `${slugBase}-${n++}`;

  const num = (key: string, fallback: number) => {
    const parsed = Number(formData.get(key));
    return Number.isNaN(parsed) || parsed === 0 ? fallback : parsed;
  };

  const daily = num("daily", 8000);

  writeData((data) => {
    data.createdVehicles.push({
      slug,
      name,
      brand: String(formData.get("brand") ?? name.split(" ")[0]).trim(),
      year: num("year", new Date().getFullYear()),
      category: String(formData.get("category") ?? "hatchback"),
      description: String(formData.get("description") ?? "").trim(),
      seats: clamp(num("seats", 5), 1, 60),
      doors: clamp(num("doors", 5), 1, 8),
      luggage: 2,
      transmission:
        String(formData.get("transmission") ?? "automatic") === "manual"
          ? "manual"
          : "automatic",
      fuel: (String(formData.get("fuel") ?? "petrol") as
        | "petrol"
        | "diesel"
        | "hybrid"
        | "electric"),
      engineCc: num("engineCc", 1500),
      daily,
      weekly: num("weekly", daily * 6),
      monthly: num("monthly", daily * 24),
      deposit: num("deposit", 30000),
      withDriverDaily: null,
      images: [
        "/images/cars/fleet-01.jpg",
        "/images/cars/fleet-02.jpg",
        "/images/cars/fleet-03.jpg",
      ],
      available: true,
      featured: false,
      createdAt: new Date().toISOString(),
      createdBy: user.id,
      deletedAt: null,
    });
  });

  audit(user.id, "vehicle.created", "vehicle", slug, `Added ${name}`, requestId);
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

  let requestId: string | null = null;
  try {
    requestId = assertCanWrite(user, "fleet.delete", slug);
  } catch (error) {
    if (error instanceof WindowRequiredError) {
      redirect(
        `/panel/fleet?error=${encodeURIComponent("You need an open window to remove a vehicle.")}`,
      );
    }
    throw error;
  }

  writeData((data) => {
    const current = data.vehicleOverrides[slug] ?? {};
    data.vehicleOverrides[slug] = {
      ...current,
      deletedAt: restore ? null : new Date().toISOString(),
    };
  });

  audit(
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
/* Bookings                                                                    */
/* -------------------------------------------------------------------------- */

export async function setBookingStatusAction(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as BookingStatus;

  const booking = readData().bookings.find((b) => b.id === id);
  if (!booking) return;

  writeData((data) => {
    const target = data.bookings.find((b) => b.id === id);
    if (!target) return;
    target.status = status;
    target.handledBy = user.id;

    // Confirming or starting a hire takes the vehicle off the website.
    // Cancelling or returning puts it back.
    if (target.carSlug) {
      const held = status === "confirmed" || status === "on_hire";
      const current = data.vehicleOverrides[target.carSlug] ?? {};
      data.vehicleOverrides[target.carSlug] = { ...current, available: !held };
    }
  });

  audit(
    user.id,
    "booking.status",
    "booking",
    id,
    `${booking.reference} set to ${status.replace("_", " ")}`,
  );

  refreshPublicFleet();
  revalidatePath("/panel/bookings");
  revalidatePath("/panel");
}

export async function setBookingPaymentAction(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const method = String(formData.get("method") ?? "unpaid") as PaymentMethod;
  const amount = Number(formData.get("amount") ?? 0) || 0;

  writeData((data) => {
    const booking = data.bookings.find((b) => b.id === id);
    if (!booking) return;
    booking.paymentMethod = method;
    booking.amount = amount;
    booking.handledBy = user.id;
  });

  audit(user.id, "booking.payment", "booking", id, `Recorded ${method.replace("_", " ")} ${amount}`);
  revalidatePath("/panel/bookings");
  revalidatePath("/panel");
}

export async function deleteBookingAction(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");

  let requestId: string | null = null;
  try {
    requestId = assertCanWrite(user, "booking.delete");
  } catch (error) {
    if (error instanceof WindowRequiredError) {
      redirect(
        `/panel/bookings?error=${encodeURIComponent("You need an open window to delete a booking.")}`,
      );
    }
    throw error;
  }

  const booking = readData().bookings.find((b) => b.id === id);
  writeData((data) => {
    data.bookings = data.bookings.filter((b) => b.id !== id);
  });

  audit(
    user.id,
    "booking.deleted",
    "booking",
    id,
    `Deleted booking ${booking?.reference ?? id}`,
    requestId,
  );
  revalidatePath("/panel/bookings");
}

/** Used by the public booking forms, and by staff taking a booking by phone. */
export async function createBookingAction(input: {
  carSlug: string | null;
  customerName: string;
  phone: string;
  email?: string;
  pickupLocation?: string;
  pickupDate: string;
  returnDate: string;
  withDriver?: boolean;
  notes?: string;
  amount?: number;
  source?: "website" | "panel";
}): Promise<string> {
  const reference = `EC-${String(readData().bookings.length + 1).padStart(4, "0")}`;

  const booking: PanelBooking = {
    id: newId("bk"),
    reference,
    carSlug: input.carSlug,
    customerName: input.customerName,
    phone: input.phone,
    email: input.email ?? "",
    pickupLocation: input.pickupLocation ?? "Heiyanthuduwa office",
    pickupDate: input.pickupDate,
    returnDate: input.returnDate,
    withDriver: input.withDriver ?? false,
    notes: input.notes ?? "",
    status: "pending",
    paymentMethod: "unpaid",
    amount: input.amount ?? 0,
    createdAt: new Date().toISOString(),
    handledBy: null,
    source: input.source ?? "website",
  };

  writeData((data) => {
    data.bookings.unshift(booking);
  });

  revalidatePath("/panel/bookings");
  revalidatePath("/panel");
  return reference;
}

/* -------------------------------------------------------------------------- */
/* Enquiries                                                                   */
/* -------------------------------------------------------------------------- */

export async function replyToEnquiryAction(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");
  const body = String(formData.get("body") ?? "").trim();
  if (body.length === 0) return;

  writeData((data) => {
    const enquiry = data.enquiries.find((e) => e.id === id);
    if (!enquiry) return;
    enquiry.messages.push({
      id: newId("msg"),
      at: new Date().toISOString(),
      fromStaffId: user.id,
      body,
    });
    enquiry.status = "answered";
    enquiry.assignedTo = user.id;
  });

  // Counting replies is only possible because they happen in here. See the
  // plan, section 8.
  audit(user.id, "enquiry.replied", "enquiry", id, "Replied to an enquiry");
  revalidatePath("/panel/enquiries");
  revalidatePath("/panel");
}

export async function closeEnquiryAction(formData: FormData) {
  const user = await requireStaff();
  const id = String(formData.get("id") ?? "");

  writeData((data) => {
    const enquiry = data.enquiries.find((e) => e.id === id);
    if (enquiry) enquiry.status = "closed";
  });

  audit(user.id, "enquiry.closed", "enquiry", id, "Closed an enquiry");
  revalidatePath("/panel/enquiries");
}

export async function createEnquiryAction(input: {
  name: string;
  email: string;
  phone: string;
  subject: string;
  body: string;
}) {
  writeData((data) => {
    data.enquiries.unshift({
      id: newId("enq"),
      name: input.name,
      email: input.email,
      phone: input.phone,
      subject: input.subject,
      createdAt: new Date().toISOString(),
      status: "open",
      assignedTo: null,
      messages: [
        {
          id: newId("msg"),
          at: new Date().toISOString(),
          fromStaffId: null,
          body: input.body,
        },
      ],
    });
  });
  revalidatePath("/panel/enquiries");
}

/* -------------------------------------------------------------------------- */
/* Staff, owner only                                                           */
/* -------------------------------------------------------------------------- */

export async function createStaffAction(formData: FormData) {
  const owner = await requireOwner();
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();

  if (name.length === 0 || email.length === 0) {
    redirect(`/panel/team?error=${encodeURIComponent("Name and email are both needed.")}`);
  }
  if (readData().staff.some((s) => s.email === email)) {
    redirect(`/panel/team?error=${encodeURIComponent("That email already has an account.")}`);
  }

  // The one-time password the client chose: generated, shown once on this
  // screen, and handed over in person. See HANDOVER section 6.
  const password = Array.from({ length: 10 }, () =>
    "abcdefghjkmnpqrstuvwxyz23456789".charAt(Math.floor(Math.random() * 31)),
  ).join("");

  const { passwordHash, passwordSalt } = hashPassword(password);

  const id = newId("staff");
  writeData((data) => {
    data.staff.push({
      id,
      name,
      email,
      role: "employee",
      passwordHash,
      passwordSalt,
      active: true,
      createdAt: new Date().toISOString(),
      oneTimePassword: password,
    });
  });

  audit(owner.id, "staff.created", "staff", id, `Created an account for ${name}`);
  revalidatePath("/panel/team");
  redirect(`/panel/team?created=${id}`);
}

export async function setStaffActiveAction(formData: FormData) {
  const owner = await requireOwner();
  const id = String(formData.get("id") ?? "");
  const active = String(formData.get("active") ?? "") === "true";

  if (id === owner.id) return; // never lock yourself out

  const target = readData().staff.find((s) => s.id === id);
  writeData((data) => {
    const staff = data.staff.find((s) => s.id === id);
    if (staff) staff.active = active;
  });

  audit(
    owner.id,
    active ? "staff.enabled" : "staff.disabled",
    "staff",
    id,
    `${active ? "Enabled" : "Disabled"} ${target?.name ?? id}`,
  );
  revalidatePath("/panel/team");
}

export async function dismissOneTimePasswordAction(formData: FormData) {
  await requireOwner();
  const id = String(formData.get("id") ?? "");
  writeData((data) => {
    const staff = data.staff.find((s) => s.id === id);
    if (staff) staff.oneTimePassword = null;
  });
  revalidatePath("/panel/team");
}
