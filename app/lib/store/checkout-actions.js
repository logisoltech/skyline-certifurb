"use server";

import { updateTag } from "next/cache";
import { updateVariantStock, getProductById, logActivity } from "../cms/db";
import { createAdminClient } from "../supabase/admin";
import { createClient } from "../supabase/server";

export async function createOrderAction({
  items,
  payment = "Cash on Delivery",
  address,
}) {
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, error: "Your cart is empty." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Sign in to place an order.", needsAuth: true };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "customer" || profile.status !== "active") {
    return { ok: false, error: "Sign in to place an order.", needsAuth: true };
  }

  const lines = [];
  for (const item of items) {
    const slug = String(item.slug ?? "");
    const qty = Number(item.qty) || 0;
    const variantId = item.variantId ? String(item.variantId) : null;
    if (!slug || qty < 1) continue;

    const { data: productRow } = await admin
      .from("products")
      .select("*, product_variants(*)")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (!productRow) {
      return { ok: false, error: `“${slug}” is no longer available.` };
    }

    const variants = productRow.product_variants ?? [];
    const variant = variantId
      ? variants.find((v) => v.id === variantId)
      : variants[0];
    if (!variant) return { ok: false, error: `An option for “${productRow.title}” is unavailable.` };
    if (variant.stock < qty) {
      return {
        ok: false,
        error: `Only ${variant.stock} left for “${productRow.title}”.`,
      };
    }

    lines.push({
      slug: productRow.slug,
      title: productRow.title,
      price: Number(variant.price),
      qty,
      variant_id: variant.id,
      sku: variant.sku,
      productId: productRow.id,
    });
  }

  if (lines.length === 0) return { ok: false, error: "Your cart is empty." };

  const total = lines.reduce((sum, line) => sum + line.price * line.qty, 0);
  const orderId = `CF-${Date.now().toString(36).toUpperCase()}`;
  const emirate = address?.emirate || profile.emirate || "";

  const { error: orderError } = await admin.from("orders").insert({
    id: orderId,
    customer_id: profile.id,
    customer_name: address?.name || profile.full_name,
    customer_email: profile.email,
    customer_phone: address?.phone || profile.phone || "",
    status: "placed",
    payment: String(payment || "Cash on Delivery").slice(0, 80),
    total,
    emirate,
    sample: false,
  });
  if (orderError) return { ok: false, error: orderError.message };

  const { error: itemsError } = await admin.from("order_items").insert(
    lines.map(({ slug, title, price, qty, variant_id, sku }) => ({
      order_id: orderId,
      slug,
      title,
      price,
      qty,
      variant_id,
      sku,
    })),
  );
  if (itemsError) {
    await admin.from("orders").delete().eq("id", orderId);
    return { ok: false, error: itemsError.message };
  }

  // Decrement stock
  for (const line of lines) {
    const product = await getProductById(line.productId);
    const variant = product?.variants?.find((v) => v.id === line.variant_id);
    if (!variant) continue;
    await updateVariantStock(line.productId, line.variant_id, Math.max(0, variant.stock - line.qty));
  }

  if (address?.emirate) {
    await admin.from("profiles").update({ emirate: address.emirate }).eq("id", profile.id);
  }

  await logActivity(
    { id: profile.id, name: profile.full_name },
    "placed an order",
    orderId,
  );
  updateTag("catalog");

  return { ok: true, orderId };
}
