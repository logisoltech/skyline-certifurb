"use server";

import { authorize, passwordProblem } from "../../lib/cms/auth";
import { ROLE_IDS } from "../../lib/cms/constants";
import {
  deleteStaffProfile,
  logActivity,
  readStore,
  updateStaffProfile,
} from "../../lib/cms/db";
import { createAdminClient } from "../../lib/supabase/admin";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const activeOwners = (users) =>
  users.filter((u) => u.role === "owner" && u.status === "active").length;

export async function createUserAction(_prev, formData) {
  const auth = await authorize("users:manage");
  if (!auth.ok) return { error: auth.error };

  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role = String(formData.get("role") ?? "");
  const password = String(formData.get("password") ?? "");

  const fieldErrors = {};
  if (name.length < 2 || name.length > 80) fieldErrors.name = "Enter a name.";
  if (!EMAIL_PATTERN.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (!ROLE_IDS.includes(role)) fieldErrors.role = "Choose a role.";
  const problem = passwordProblem(password);
  if (problem) fieldErrors.password = problem;
  if (Object.keys(fieldErrors).length > 0) return { fieldErrors };

  const admin = createAdminClient();
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: name,
      role,
      status: "active",
    },
  });
  if (error) {
    if (/already/i.test(error.message)) {
      return { fieldErrors: { email: "A user with this email already exists." } };
    }
    return { error: error.message };
  }

  await admin
    .from("profiles")
    .update({
      full_name: name,
      email,
      role,
      status: "active",
    })
    .eq("id", data.user.id);

  await logActivity(auth.user, "added a CMS user", `${name} (${role})`);
  return { ok: true, message: `${name} can now sign in with the password you set.` };
}

export async function updateUserAction(id, change) {
  const auth = await authorize("users:manage");
  if (!auth.ok) return auth;

  const { users } = await readStore();
  const target = users.find((u) => u.id === String(id));
  if (!target) return { ok: false, error: "That user no longer exists." };

  const isSelf = target.id === auth.user.id;
  const beforeOwners = activeOwners(users);

  if (change.action === "delete") {
    if (isSelf) return { ok: false, error: "You can't delete your own account here." };
    if (target.role === "owner" && target.status === "active" && beforeOwners <= 1) {
      return { ok: false, error: "You can't remove the last owner." };
    }
    await deleteStaffProfile(target.id);
    await logActivity(auth.user, "removed a CMS user", target.email);
    return { ok: true };
  }

  if (change.action === "approve") {
    if (!ROLE_IDS.includes(change.role)) return { ok: false, error: "Choose a role." };
    await updateStaffProfile(target.id, { status: "active", role: change.role });
    await logActivity(auth.user, "approved a CMS user", `${target.email} as ${change.role}`);
    return { ok: true };
  }

  if (change.action === "role") {
    if (!ROLE_IDS.includes(change.role)) return { ok: false, error: "Choose a role." };
    if (isSelf) return { ok: false, error: "You can't change your own role." };
    if (target.role === "owner" && change.role !== "owner" && target.status === "active" && beforeOwners <= 1) {
      return { ok: false, error: "There must be at least one owner." };
    }
    await updateStaffProfile(target.id, { role: change.role });
    await logActivity(auth.user, "changed a role", `${target.email} → ${change.role}`);
    return { ok: true };
  }

  if (change.action === "disable" || change.action === "enable") {
    if (isSelf) return { ok: false, error: "You can't disable your own account." };
    if (change.action === "disable" && target.role === "owner" && target.status === "active" && beforeOwners <= 1) {
      return { ok: false, error: "You can't disable the last owner." };
    }
    await updateStaffProfile(target.id, {
      status: change.action === "disable" ? "disabled" : "active",
    });
    if (change.action === "disable") {
      const admin = createAdminClient();
      await admin.auth.admin.signOut(target.id, "global");
    }
    await logActivity(auth.user, `${change.action}d a CMS user`, target.email);
    return { ok: true };
  }

  return { ok: false, error: "Unknown action." };
}
