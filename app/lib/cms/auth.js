// ---------------------------------------------------------------------------
// Server-only CMS authentication (Supabase Auth + profiles).
// Never import this file from a Client Component.
// ---------------------------------------------------------------------------

import { cache } from "react";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "../supabase/server";
import { can } from "./constants";
import { getStaffById } from "./auth-helpers";

export { passwordProblem } from "./auth-helpers";

export const publicUser = ({ id, name, email, role, status, createdAt, lastLoginAt }) => ({
  id,
  name,
  email,
  role,
  status,
  createdAt,
  lastLoginAt: lastLoginAt ?? null,
});

export const getCurrentUser = cache(async () => {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await getStaffById(user.id);
  if (!profile || profile.status !== "active") return null;
  return publicUser(profile);
});

export async function requireUser(permission) {
  const user = await getCurrentUser();
  if (!user) redirect("/cms/login");
  if (permission && !can(user.role, permission)) redirect("/cms?denied=1");
  return user;
}

export async function authorize(permission) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (permission && !can(user.role, permission)) {
    return { ok: false, error: "You don't have permission to do that." };
  }
  return { ok: true, user };
}

// Brute-force throttle (in memory, per email)
const attempts = (globalThis.__certifurbLoginAttempts ??= new Map());
const MAX_FAILURES = 5;
const LOCK_MS = 15 * 60 * 1000;

export function loginLockedFor(email) {
  const entry = attempts.get(email);
  if (entry?.until && entry.until > Date.now()) return Math.ceil((entry.until - Date.now()) / 60000);
  return 0;
}

export function recordLoginFailure(email) {
  const entry = attempts.get(email) ?? { count: 0, until: 0 };
  entry.count += 1;
  if (entry.count >= MAX_FAILURES) {
    entry.until = Date.now() + LOCK_MS;
    entry.count = 0;
  }
  attempts.set(email, entry);
}

export function clearLoginFailures(email) {
  attempts.delete(email);
}

// Kept for callers that still import these names (no-ops / unused with Supabase Auth).
export async function hashPassword() {
  throw new Error("Passwords are managed by Supabase Auth");
}
export async function verifyPassword() {
  return false;
}
export async function burnPasswordCheck() {}
export async function createSession() {}
export async function destroySession() {
  const supabase = await createClient();
  await supabase.auth.signOut();
}
