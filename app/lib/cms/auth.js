// ---------------------------------------------------------------------------
// Server-only CMS authentication.
//
// - Passwords: scrypt with a random per-user salt, compared in constant time.
// - Sessions: a signed (HMAC-SHA256), httpOnly, SameSite=Lax cookie holding
//   only { user id, expiry, session version }. The user record is re-read on
//   every request, so disabling a user, changing a role or changing a
//   password takes effect immediately.
// - Server Actions get Next.js's built-in Origin check against CSRF.
//
// Never import this file from a Client Component.
// ---------------------------------------------------------------------------

import crypto from "node:crypto";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { can } from "./constants";
import { readStore } from "./db";

export const SESSION_COOKIE = "cf_cms_session";
const SESSION_SECONDS = 60 * 60 * 8; // 8 hours

// ---- passwords ------------------------------------------------------------

function scrypt(password, salt) {
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, key) => (err ? reject(err) : resolve(key)));
  });
}

export async function hashPassword(password) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(password, salt);
  return `${salt.toString("hex")}:${key.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [saltHex, keyHex] = String(stored ?? "").split(":");
  if (!saltHex || !keyHex) return false;
  const expected = Buffer.from(keyHex, "hex");
  const actual = await scrypt(password, Buffer.from(saltHex, "hex"));
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

// Used so "unknown email" takes as long as "wrong password".
let dummyHash;
export async function burnPasswordCheck(password) {
  dummyHash ??= await hashPassword("not-a-real-password");
  await verifyPassword(password, dummyHash);
}

export function passwordProblem(password) {
  if (password.length < 10) return "Use at least 10 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Include at least one letter and one number.";
  }
  return null;
}

// ---- sessions -------------------------------------------------------------

let cachedSecret;
async function getSecret() {
  if (process.env.CMS_SECRET) return process.env.CMS_SECRET;
  cachedSecret ??= (await readStore()).meta.secret;
  return cachedSecret;
}

const b64 = (input) => Buffer.from(input).toString("base64url");

async function sign(body) {
  const secret = await getSecret();
  return crypto.createHmac("sha256", secret).update(body).digest("base64url");
}

export async function createSession(user) {
  const body = b64(
    JSON.stringify({
      uid: user.id,
      sv: user.sessionVersion ?? 0,
      exp: Date.now() + SESSION_SECONDS * 1000,
    }),
  );
  const token = `${body}.${await sign(body)}`;
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_SECONDS,
  });
}

export async function destroySession() {
  (await cookies()).delete(SESSION_COOKIE);
}

// The signed-in, active CMS user (or null). Cached per request.
export const getCurrentUser = cache(async () => {
  // Session expiry uses Date.now(); mark this as request-time so Cache
  // Components don't try to prerender it.
  await connection();
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  const expected = await sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!payload?.uid || payload.exp < Date.now()) return null;

  const { users } = await readStore();
  const user = users.find((u) => u.id === payload.uid);
  if (!user || user.status !== "active") return null;
  if ((user.sessionVersion ?? 0) !== payload.sv) return null;
  return publicUser(user);
});

export const publicUser = ({ id, name, email, role, status, createdAt, lastLoginAt }) => ({
  id,
  name,
  email,
  role,
  status,
  createdAt,
  lastLoginAt: lastLoginAt ?? null,
});

// ---- guards ---------------------------------------------------------------

// For pages/layouts: send anonymous visitors to the login screen.
export async function requireUser(permission) {
  const user = await getCurrentUser();
  if (!user) redirect("/cms/login");
  if (permission && !can(user.role, permission)) redirect("/cms?denied=1");
  return user;
}

// For Server Actions: never redirect, return a result the form can show.
export async function authorize(permission) {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Your session has expired. Please sign in again." };
  if (permission && !can(user.role, permission)) {
    return { ok: false, error: "You don't have permission to do that." };
  }
  return { ok: true, user };
}

// ---- brute-force throttle (in memory, per email) -------------------------

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
