"use server";

import { authorize } from "../../lib/cms/auth";
import { ORDER_STATUSES } from "../../lib/cms/constants";
import { logActivity, mutateStore } from "../../lib/cms/db";

export async function setOrderStatusAction(id, status) {
  const auth = await authorize("orders:write");
  if (!auth.ok) return auth;
  if (!ORDER_STATUSES.some((s) => s.id === status)) {
    return { ok: false, error: "Unknown status." };
  }

  return mutateStore((data) => {
    const order = data.orders.find((o) => o.id === String(id));
    if (!order) return { ok: false, error: "That order no longer exists." };
    if (order.status !== status) {
      const before = order.status;
      order.status = status;
      logActivity(data, auth.user, "updated an order", `${order.id}: ${before} → ${status}`);
    }
    return { ok: true, status };
  });
}
