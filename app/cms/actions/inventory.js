"use server";

import { updateTag } from "next/cache";
import { authorize } from "../../lib/cms/auth";
import { logActivity, setLowStockThreshold, updateVariantStock } from "../../lib/cms/db";

export async function setStockAction(productId, variantId, stock) {
  const auth = await authorize("inventory:write");
  if (!auth.ok) return auth;

  const value = Number(stock);
  if (!Number.isInteger(value) || value < 0 || value > 10000) {
    return { ok: false, error: "Stock must be a whole number from 0 to 10,000." };
  }

  const product = await updateVariantStock(String(productId), String(variantId), value);
  if (!product) return { ok: false, error: "That product no longer exists." };

  const variant = product.variants.find((v) => v.id === String(variantId));
  if (!variant) return { ok: false, error: "That option no longer exists." };

  await logActivity(auth.user, "changed stock", `${variant.sku}: → ${value}`);
  updateTag("catalog");
  return { ok: true, stock: value };
}

export async function setLowStockThresholdAction(threshold) {
  const auth = await authorize("inventory:write");
  if (!auth.ok) return auth;

  const value = Number(threshold);
  if (!Number.isInteger(value) || value < 0 || value > 1000) {
    return { ok: false, error: "Enter a whole number from 0 to 1,000." };
  }
  await setLowStockThreshold(value);
  await logActivity(auth.user, "changed the low-stock threshold", String(value));
  return { ok: true, threshold: value };
}
