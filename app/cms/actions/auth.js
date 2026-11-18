"use server";

import { redirect } from "next/navigation";
import {
  authorize,
  clearLoginFailures,
  destroySession,
  loginLockedFor,
  passwordProblem,
  recordLoginFailure,
} from "../../lib/cms/auth";
import {
  countStaffUsers,
  getStaffByEmail,
  logActivity,
  updateStaffProfile,
} from "../../lib/cms/db";
import { createAdminClient } from "../../lib/supabase/admin";
import { createClient } from "../../lib/supabase/server";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const text = (formData, key) => String(formData.get(key) ?? "").trim();

function safeCmsPath(path) {
  return typeof path === "string" && /^\/cms(\/|$)/.test(path) && !path.includes("//")
    ? path
    : "/cms";
}

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

  const staff = await getStaffByEmail(email);
  if (!staff) {
    recordLoginFailure(email);
    return { error: "Incorrect email or password." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    recordLoginFailure(email);
    return { error: "Incorrect email or password." };
  }

  if (staff.status === "pending") {
    await supabase.auth.signOut();
    return { error: "Your account is waiting for an owner to approve it." };
  }
  if (staff.status !== "active") {
    await supabase.auth.signOut();
    return { error: "This account has been disabled. Contact an owner." };
  }

  clearLoginFailures(email);
  await updateStaffProfile(staff.id, { lastLoginAt: new Date().toISOString() });
  await logActivity(staff, "signed in");
  redirect(next);
}

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

  const existing = await getStaffByEmail(email);
  if (existing) {
    return { fieldErrors: { email: "An account with this email already exists." } };
  }

  const staffCount = await countStaffUsers();
  const isFirst = staffCount === 0;
  const role = isFirst ? "owner" : "viewer";
  const status = isFirst ? "active" : "pending";

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      role,
      status,
    },
  });
  if (error) {
    if (/already/i.test(error.message)) {
      return { fieldErrors: { email: "An account with this email already exists." } };
    }
    return { error: error.message };
  }

  // Ensure profile role/status (trigger may have set defaults).
  await admin
    .from("profiles")
    .update({
      full_name: name,
      email,
      role,
      status,
      last_login_at: isFirst ? new Date().toISOString() : null,
    })
    .eq("id", data.user.id);

  const user = {
    id: data.user.id,
    name,
    email,
    role,
    status,
  };
  await logActivity(user, isFirst ? "created the owner account" : "requested access");

  if (isFirst) {
    const supabase = await createClient();
    await supabase.auth.signInWithPassword({ email, password });
    redirect("/cms");
  }

  return {
    pending: true,
    message: "Thanks! Your request was sent. An owner needs to approve it before you can sign in.",
  };
}

export async function logoutAction() {
  await destroySession();
  redirect("/cms/login");
}

export async function updateOwnProfileAction(_prev, formData) {
  const auth = await authorize();
  if (!auth.ok) return { error: auth.error };

  const name = text(formData, "name");
  if (name.length < 2 || name.length > 80) return { fieldErrors: { name: "Enter your full name." } };

  await updateStaffProfile(auth.user.id, { name });
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

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: auth.user.email,
    password: current,
  });
  if (signInError) {
    return { fieldErrors: { current: "Current password is incorrect." } };
  }

  const { error } = await supabase.auth.updateUser({ password: next });
  if (error) return { error: error.message };

  await logActivity(auth.user, "changed their password");
  return { ok: true, message: "Password updated." };
}
