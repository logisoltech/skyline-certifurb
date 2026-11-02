"use server";

import { redirect } from "next/navigation";
import {
  authorize,
  burnPasswordCheck,
  clearLoginFailures,
  createSession,
  destroySession,
  hashPassword,
  loginLockedFor,
  passwordProblem,
  recordLoginFailure,
  verifyPassword,
} from "../../lib/cms/auth";
import { logActivity, mutateStore, newId, readStore } from "../../lib/cms/db";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const text = (formData, key) => String(formData.get(key) ?? "").trim();

// Only allow redirects to CMS pages (no open redirects).
function safeCmsPath(path) {
  return typeof path === "string" && /^\/cms(\/|$)/.test(path) && !path.includes("//")
    ? path
    : "/cms";
}

// ---------------------------------------------------------------------------

export async function loginAction(_prev, formData) {
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeCmsPath(text(formData, "next"));

  if (!EMAIL_PATTERN.test(email) || !password) {
    return { error: "Enter your email and password." };
  }

  const locked = loginLockedFor(email);
  if (locked) {
    return { error: `Too many failed attempts. Try again in ${locked} minute${locked === 1 ? "" : "s"}.` };
  }

  const { users } = await readStore();
  const user = users.find((u) => u.email === email);

  if (!user) {
    await burnPasswordCheck(password); // same timing as a real check
    recordLoginFailure(email);
    return { error: "Incorrect email or password." };
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    recordLoginFailure(email);
    return { error: "Incorrect email or password." };
  }

  // Only reveal account status after the password was right.
  if (user.status === "pending") {
    return { error: "Your account is waiting for an owner to approve it." };
  }
  if (user.status !== "active") {
    return { error: "This account has been disabled. Contact an owner." };
  }

  clearLoginFailures(email);
  await mutateStore((data) => {
    const record = data.users.find((u) => u.id === user.id);
    if (record) record.lastLoginAt = new Date().toISOString();
    logActivity(data, user, "signed in");
  });
  await createSession(user);
  redirect(next);
}

// ---------------------------------------------------------------------------

export async function signupAction(_prev, formData) {
  const name = text(formData, "name");
  const email = text(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const fieldErrors = {};
  if (name.length < 2 || name.length > 80) fieldErrors.name = "Enter your full name.";
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Enter a valid email address.";
  const problem = passwordProblem(password);
  if (problem) fieldErrors.password = problem;
  if (confirm !== password) fieldErrors.confirm = "Passwords don't match.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const passwordHash = await hashPassword(password);

  const outcome = await mutateStore((data) => {
    if (data.users.some((u) => u.email === email)) return { duplicate: true };

    // The very first account becomes the Owner and is active immediately.
    // Everyone after that is a pending request that an Owner must approve.
    const isFirst = data.users.length === 0;
    const user = {
      id: newId("usr"),
      name,
      email,
      role: isFirst ? "owner" : "viewer",
      status: isFirst ? "active" : "pending",
      passwordHash,
      sessionVersion: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: isFirst ? new Date().toISOString() : null,
    };
    data.users.push(user);
    logActivity(data, user, isFirst ? "created the owner account" : "requested access");
    return { user, isFirst };
  });

  if (outcome.duplicate) {
    return { fieldErrors: { email: "An account with this email already exists." } };
  }
  if (outcome.isFirst) {
    await createSession(outcome.user);
    redirect("/cms");
  }
  return {
    pending: true,
    message: "Thanks! Your request was sent. An owner needs to approve it before you can sign in.",
  };
}

// ---------------------------------------------------------------------------

export async function logoutAction() {
  await destroySession();
  redirect("/cms/login");
}

// ---------------------------------------------------------------------------
// "My account": update own name and password.

export async function updateOwnProfileAction(_prev, formData) {
  const auth = await authorize();
  if (!auth.ok) return { error: auth.error };

  const name = text(formData, "name");
  if (name.length < 2 || name.length > 80) return { fieldErrors: { name: "Enter your full name." } };

  await mutateStore((data) => {
    const record = data.users.find((u) => u.id === auth.user.id);
    if (record) record.name = name;
  });
  return { ok: true, message: "Profile updated." };
}

export async function changeOwnPasswordAction(_prev, formData) {
  const auth = await authorize();
  if (!auth.ok) return { error: auth.error };

  const current = String(formData.get("current") ?? "");
  const next = String(formData.get("next") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  const fieldErrors = {};
  const problem = passwordProblem(next);
  if (problem) fieldErrors.next = problem;
  if (confirm !== next) fieldErrors.confirm = "Passwords don't match.";
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const { users } = await readStore();
  const record = users.find((u) => u.id === auth.user.id);
  if (!record || !(await verifyPassword(current, record.passwordHash))) {
    return { fieldErrors: { current: "Current password is incorrect." } };
  }

  const passwordHash = await hashPassword(next);
  const updated = await mutateStore((data) => {
    const target = data.users.find((u) => u.id === auth.user.id);
    target.passwordHash = passwordHash;
    // Invalidates every other session; this one is re-issued below.
    target.sessionVersion = (target.sessionVersion ?? 0) + 1;
    logActivity(data, auth.user, "changed their password");
    return { ...target };
  });
  await createSession(updated);
  return { ok: true, message: "Password updated. Other devices have been signed out." };
}
