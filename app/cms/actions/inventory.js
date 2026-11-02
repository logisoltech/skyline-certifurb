"use server";

import { updateTag } from "next/cache";
import { authorize } from "../../lib/cms/auth";
import { logActivity, mutateStore } from "../../lib/cms/db";
import { syncDerived } from "../../lib/cms/product-model";

export async function setStockAction(productId, variantId, stock) {
  const auth = await authorize("inventory:write");
  if (!auth.ok) return auth;

  const value = Number(stock);
  if (!Number.isInteger(value) || value < 0 || value > 10000) {
    return { ok: false, error: "Stock must be a whole number from 0 to 10,000." };
  }

  const result = await mutateStore((data) => {
    const product = data.products.find((p) => p.id === String(productId));
    if (!product) return { ok: false, error: "That product no longer exists." };
    const variant = (product.variants ?? []).find((v) => v.id === String(variantId));
    if (!variant) return { ok: false, error: "That option no longer exists." };
    const before = variant.stock;
    if (before === value) return { ok: true, stock: value };
    variant.stock = value;
    Object.assign(product, syncDerived(product), { updatedAt: new Date().toISOString() });
    logActivity(data, auth.user, "changed stock", `${variant.sku}: ${before} → ${value}`);
    return { ok: true, stock: value };
  });

  if (result.ok) updateTag("catalog");
  return result;
}

export async function setLowStockThresholdAction(threshold) {
  const auth = await authorize("inventory:write");
  if (!auth.ok) return auth;

  const value = Number(threshold);
  if (!Number.isInteger(value) || value < 0 || value > 1000) {
    return { ok: false, error: "Enter a whole number from 0 to 1,000." };
  }
  await mutateStore((data) => {
    data.settings.lowStockThreshold = value;
    logActivity(data, auth.user, "changed the low-stock threshold", String(value));
  });
  return { ok: true, threshold: value };
}
