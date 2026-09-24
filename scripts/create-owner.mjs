// Creates THE owner account: a Supabase Auth login plus its staff row.
//
//   node --env-file=.env.local scripts/create-owner.mjs "Full Name" owner@example.com [mobile]
//
// Run once, from a terminal you trust. There is no sign-up page, on purpose:
// the owner creates every employee account from inside the panel, and this
// script is how the very first account comes to exist.
//
// The password is generated, printed ONCE, and never stored anywhere but as a
// hash inside Supabase Auth. Copy it straight away.
//
// Refuses to run if an owner already exists: the database allows exactly one.

import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const [name, rawEmail, phone = ""] = process.argv.slice(2);
const email = (rawEmail ?? "").trim().toLowerCase();

if (!name || !email || !email.includes("@")) {
  console.error('Usage: node --env-file=.env.local scripts/create-owner.mjs "Full Name" owner@example.com [mobile]');
  process.exit(1);
}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set. Did you pass --env-file=.env.local?");
  process.exit(1);
}

const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

const { data: owners, error: ownerError } = await admin.from("staff").select("email").eq("role", "owner");
if (ownerError) {
  console.error(`Could not read the staff table: ${ownerError.message}`);
  process.exit(1);
}
if (owners.length > 0) {
  console.error(`An owner already exists (${owners[0].email}). There can be only one.`);
  process.exit(1);
}

// 16 characters from an alphabet with no lookalikes. Cryptographically random.
const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789";
const password = Array.from({ length: 16 }, () => alphabet[crypto.randomInt(alphabet.length)]).join("");

const { data: created, error: createError } = await admin.auth.admin.createUser({
  email,
  password,
  email_confirm: true,
});
if (createError || !created.user) {
  console.error(`Could not create the login: ${createError?.message ?? "unknown error"}`);
  process.exit(1);
}

const { error: staffError } = await admin.from("staff").insert({
  id: created.user.id,
  name: name.trim(),
  email,
  role: "owner",
  active: true,
  phone: phone.trim(),
  sms_alerts: true,
});
if (staffError) {
  // A login with no staff row can never get in. Remove it.
  await admin.auth.admin.deleteUser(created.user.id);
  console.error(`Could not create the staff row, login removed: ${staffError.message}`);
  process.exit(1);
}

console.log("");
console.log("Owner account created.");
console.log(`  Name:     ${name.trim()}`);
console.log(`  Email:    ${email}`);
console.log(`  Password: ${password}`);
console.log("");
console.log("This password is shown once and stored nowhere. Copy it now.");
console.log("Sign in at /999p7k.");
