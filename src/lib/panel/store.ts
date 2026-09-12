import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import type { PanelData, StaffUser } from "./types";

/**
 * The data store, standing in for Supabase.
 *
 * SERVER ONLY. Never import this from a client component: it reaches for
 * node:fs and holds password hashes.
 *
 * Everything lives in one JSON file under .data/, which is gitignored. That
 * gives real persistence across `next dev` restarts without a database. On a
 * read-only filesystem (Vercel) the write silently falls back to memory, so the
 * panel still runs in a deployed preview; it just forgets on redeploy. This is
 * a scaffold to finish the functionality against, not a production store.
 */

const DATA_DIR = path.join(process.cwd(), ".data");
const DATA_FILE = path.join(DATA_DIR, "panel.json");

/* -------------------------------------------------------------------------- */
/* Passwords                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * scrypt, so the store never holds a plaintext password even in development.
 * Swapping to Supabase Auth later replaces these two functions, nothing else.
 */
export function hashPassword(plain: string, salt?: string) {
  const passwordSalt = salt ?? crypto.randomBytes(16).toString("hex");
  const passwordHash = crypto
    .scryptSync(plain, passwordSalt, 64)
    .toString("hex");
  return { passwordHash, passwordSalt };
}

export function verifyPassword(plain: string, user: StaffUser): boolean {
  const candidate = crypto.scryptSync(plain, user.passwordSalt, 64);
  const known = Buffer.from(user.passwordHash, "hex");
  if (candidate.length !== known.length) return false;
  return crypto.timingSafeEqual(candidate, known);
}

/* -------------------------------------------------------------------------- */
/* Seed                                                                        */
/* -------------------------------------------------------------------------- */

/**
 * TEST CREDENTIALS. Development only.
 *
 * These exist so the panel can be signed into before Supabase Auth is wired.
 * They are hashed on first run, so the plaintext lives only in this file.
 * DELETE THIS BLOCK before anything is exposed publicly.
 */
export const TEST_ACCOUNTS = [
  {
    name: "Owner",
    email: "owner@extracabs.lk",
    password: "owner1234",
    role: "owner" as const,
  },
  {
    name: "Kasun",
    email: "kasun@extracabs.lk",
    password: "kasun1234",
    role: "employee" as const,
  },
  {
    name: "Nuwan",
    email: "nuwan@extracabs.lk",
    password: "nuwan1234",
    role: "employee" as const,
  },
];

export function newId(prefix: string): string {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

function seed(): PanelData {
  const now = new Date().toISOString();
  return {
    staff: TEST_ACCOUNTS.map((account, index) => {
      const { passwordHash, passwordSalt } = hashPassword(account.password);
      return {
        id: `staff_${index + 1}`,
        name: account.name,
        email: account.email.toLowerCase(),
        role: account.role,
        passwordHash,
        passwordSalt,
        active: true,
        createdAt: now,
        oneTimePassword: null,
        // Blank on purpose. Nobody gets a booking alert until a real number is
        // typed into /panel/team, and a placeholder here would text a stranger.
        phone: "",
        smsAlerts: true,
      };
    }),
    shifts: [],
    presence: [],
    accessRequests: [],
    audit: [],
    bookings: [],
    enquiries: [],
    messages: [],
    vehicleOverrides: {},
    createdVehicles: [],
  };
}

/* -------------------------------------------------------------------------- */
/* Read and write                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Fallback copy, used only when the filesystem cannot be written.
 *
 * It is deliberately NOT a cache of the file. Next compiles pages, route
 * handlers and server actions into separate server bundles, and each one gets
 * its own instance of this module with its own module-level state. An
 * in-process cache therefore goes stale the instant a different bundle writes:
 * the panel would save an edit and the public page, holding its own copy from
 * first load, would keep serving the old value forever.
 *
 * That is a real bug this code had. The file is the single source of truth, so
 * every read goes to the file.
 */
let memory: PanelData | null = null;
let diskWritable = true;

/**
 * Fill in fields added after a store was already written.
 *
 * The file on disk was written by an older shape of the code, so a new array
 * is `undefined` there and the first `.push()` on it throws. Postgres would
 * call this a migration; here it is a few lines that run on every read.
 *
 * Add defaults, and do not overwrite a stored value unless it can no longer be
 * represented. The fuel rewrite below is the one such case: "hybrid" was
 * removed from the fuel union, so leaving it would be leaving invalid data.
 */
function hydrate(data: PanelData): PanelData {
  data.messages ??= [];
  for (const staff of data.staff) {
    staff.phone ??= "";
    staff.smsAlerts ??= true;
  }

  // Hybrid used to be one of the fuel options. It is a drivetrain now, so a
  // vehicle saved as "hybrid" fuel is rewritten to petrol with the flag set.
  // Without this a store written last week keeps serving "Hybrid" as a fuel
  // type, which is the exact thing the split was meant to end.
  for (const vehicle of data.createdVehicles) {
    if ((vehicle.fuel as string) === "hybrid") {
      vehicle.fuel = "petrol";
      vehicle.hybrid = true;
    }
    vehicle.hybrid ??= false;
  }

  for (const override of Object.values(data.vehicleOverrides)) {
    if ((override.fuel as string) === "hybrid") {
      override.fuel = "petrol";
      override.hybrid = true;
    }
  }

  return data;
}

function load(): PanelData {
  if (diskWritable) {
    try {
      return hydrate(JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as PanelData);
    } catch {
      // No file yet on first run, or the disk is unreadable. Fall through.
    }
  }

  if (memory) return memory;

  memory = seed();
  persist(memory);
  return memory;
}

function persist(data: PanelData): void {
  memory = data;
  if (!diskWritable) return;
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // Read-only filesystem, which is the case on Vercel. Keep going in memory
    // rather than failing the request; it just will not survive a redeploy.
    diskWritable = false;
  }
}

/** Read-only view of everything. */
export function readData(): PanelData {
  return load();
}

/**
 * Mutate and persist in one step.
 *
 * There is no transaction here, which is fine for three users on one process
 * and is exactly the guarantee that improves when this becomes Postgres.
 */
export function writeData<T>(mutate: (data: PanelData) => T): T {
  const data = load();
  const result = mutate(data);
  persist(data);
  return result;
}

/** Wipes the store back to seed. Used by the reset control in the panel. */
export function resetData(): void {
  memory = seed();
  persist(memory);
}
