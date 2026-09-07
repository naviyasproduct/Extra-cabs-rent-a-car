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
      };
    }),
    shifts: [],
    presence: [],
    accessRequests: [],
    audit: [],
    bookings: [],
    enquiries: [],
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

function load(): PanelData {
  if (diskWritable) {
    try {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf8")) as PanelData;
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
