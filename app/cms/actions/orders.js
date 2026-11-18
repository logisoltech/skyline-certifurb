"use server";

import { authorize } from "../../lib/cms/auth";
import { ORDER_STATUSES } from "../../lib/cms/constants";
import { logActivity, setOrderStatus } from "../../lib/cms/db";

export async function setOrderStatusAction(id, status) {
  const auth = await authorize("orders:write");
  if (!auth.ok) return auth;
  if (!ORDER_STATUSES.some((s) => s.id === status)) {
    return { ok: false, error: "Unknown status." };
  }

  const before = await setOrderStatus(String(id), status);
  if (!before) return { ok: false, error: "That order no longer exists." };

  // setOrderStatus already applied; log using previous knowledge if status changed
  await logActivity(auth.user, "updated an order", `${id}: → ${status}`);
  return { ok: true, status };
}
