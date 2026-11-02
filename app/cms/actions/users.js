"use server";

import { authorize, hashPassword, passwordProblem } from "../../lib/cms/auth";
import { ROLE_IDS } from "../../lib/cms/constants";
import { logActivity, mutateStore, newId } from "../../lib/cms/db";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const activeOwners = (users) =>
  users.filter((u) => u.role === "owner" && u.status === "active").length;

// ---------------------------------------------------------------------------
// Owner creates a user directly (with a temporary password they hand over).

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

  const passwordHash = await hashPassword(password);
  const outcome = await mutateStore((data) => {
    if (data.users.some((u) => u.email === email)) return { duplicate: true };
    data.users.push({
      id: newId("usr"),
      name,
      email,
      role,
      status: "active",
      passwordHash,
      sessionVersion: 0,
      createdAt: new Date().toISOString(),
      lastLoginAt: null,
    });
    logActivity(data, auth.user, "added a CMS user", `${name} (${role})`);
    return { ok: true };
  });

  if (outcome.duplicate) return { fieldErrors: { email: "A user with this email already exists." } };
  return { ok: true, message: `${name} can now sign in with the password you set.` };
}

// ---------------------------------------------------------------------------
// Approve / change role / enable / disable / delete.

export async function updateUserAction(id, change) {
  const auth = await authorize("users:manage");
  if (!auth.ok) return auth;

  return mutateStore((data) => {
    const target = data.users.find((u) => u.id === String(id));
    if (!target) return { ok: false, error: "That user no longer exists." };

    const isSelf = target.id === auth.user.id;
    const beforeOwners = activeOwners(data.users);

    if (change.action === "delete") {
      if (isSelf) return { ok: false, error: "You can't delete your own account here." };
      if (target.role === "owner" && target.status === "active" && beforeOwners <= 1) {
        return { ok: false, error: "You can't remove the last owner." };
      }
      data.users = data.users.filter((u) => u.id !== target.id);
      logActivity(data, auth.user, "removed a CMS user", target.email);
      return { ok: true };
    }

    if (change.action === "approve") {
      if (!ROLE_IDS.includes(change.role)) return { ok: false, error: "Choose a role." };
      target.status = "active";
      target.role = change.role;
      logActivity(data, auth.user, "approved a CMS user", `${target.email} as ${change.role}`);
      return { ok: true };
    }

    if (change.action === "role") {
      if (!ROLE_IDS.includes(change.role)) return { ok: false, error: "Choose a role." };
      if (isSelf) return { ok: false, error: "You can't change your own role." };
      if (target.role === "owner" && change.role !== "owner" && target.status === "active" && beforeOwners <= 1) {
        return { ok: false, error: "There must be at least one owner." };
      }
      target.role = change.role;
      logActivity(data, auth.user, "changed a role", `${target.email} → ${change.role}`);
      return { ok: true };
    }

    if (change.action === "disable" || change.action === "enable") {
      if (isSelf) return { ok: false, error: "You can't disable your own account." };
      if (change.action === "disable" && target.role === "owner" && target.status === "active" && beforeOwners <= 1) {
        return { ok: false, error: "You can't disable the last owner." };
      }
      target.status = change.action === "disable" ? "disabled" : "active";
      // Kills any session the user currently has.
      target.sessionVersion = (target.sessionVersion ?? 0) + 1;
      logActivity(data, auth.user, `${change.action}d a CMS user`, target.email);
      return { ok: true };
    }

    return { ok: false, error: "Unknown action." };
  });
}
