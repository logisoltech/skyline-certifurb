// ---------------------------------------------------------------------------
// Server-only data access for the CMS and catalogue (Supabase / Postgres).
// Never import this file from a Client Component.
// ---------------------------------------------------------------------------

import crypto from "node:crypto";
import { createAdminClient } from "../supabase/admin";
import { createPublicClient } from "../supabase/public";
import { createClient } from "../supabase/server";
import {
  mapActivity,
  mapCustomer,
  mapOrder,
  mapProduct,
  mapStaffUser,
  productToRow,
  variantToRow,
} from "./mappers";

export const newId = (prefix) => `${prefix}_${crypto.randomBytes(5).toString("hex")}`;

export async function getDb() {
  return createClient();
}

export async function getAdminDb() {
  return createAdminClient();
}

export async function logActivity(user, action, detail = "") {
  const db = await getAdminDb();
  await db.from("activity_log").insert({
    user_id: user?.id ?? null,
    user_name: user?.name ?? user?.full_name ?? "System",
    action,
    detail: String(detail ?? "").slice(0, 500),
  });
  // Keep the feed capped.
  const { data: old } = await db
    .from("activity_log")
    .select("id")
    .order("at", { ascending: false })
    .range(200, 400);
  if (old?.length) {
    await db.from("activity_log").delete().in(
      "id",
      old.map((row) => row.id),
    );
  }
}

async function loadProducts(db) {
  const { data, error } = await db
    .from("products")
    .select("*, product_variants(*)")
    .order("updated_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) =>
    mapProduct(
      row,
      (row.product_variants ?? []).sort((a, b) => a.sort_order - b.sort_order),
    ),
  );
}

async function loadStaffUsers(db) {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .neq("role", "customer")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []).map(mapStaffUser);
}

async function loadCustomers(db) {
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("role", "customer")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapCustomer);
}

async function loadOrders(db) {
  const { data, error } = await db
    .from("orders")
    .select("*, order_items(*)")
    .order("placed_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapOrder(row, row.order_items));
}

async function loadActivity(db) {
  const { data, error } = await db
    .from("activity_log")
    .select("*")
    .order("at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map(mapActivity);
}

async function loadSettings(db) {
  const { data, error } = await db.from("settings").select("*").eq("id", 1).maybeSingle();
  if (error) throw error;
  return {
    lowStockThreshold: data?.low_stock_threshold ?? 3,
  };
}

// Aggregate shape used by CMS pages (same keys as the old JSON store).
export async function readStore() {
  const db = await getAdminDb();
  const [products, users, customers, orders, activity, settings] = await Promise.all([
    loadProducts(db),
    loadStaffUsers(db),
    loadCustomers(db),
    loadOrders(db),
    loadActivity(db),
    loadSettings(db),
  ]);
  return {
    products,
    users,
    customers,
    orders,
    activity,
    settings,
    meta: { createdAt: null },
  };
}

export async function listProducts() {
  return loadProducts(await getAdminDb());
}

export async function getProductById(id) {
  const db = await getAdminDb();
  const { data, error } = await db
    .from("products")
    .select("*, product_variants(*)")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProduct(
    data,
    (data.product_variants ?? []).sort((a, b) => a.sort_order - b.sort_order),
  );
}

export async function upsertProductRecord(product) {
  const db = await getAdminDb();
  const row = productToRow(product);
  const { error } = await db.from("products").upsert(row);
  if (error) throw error;

  const variantRows = (product.variants ?? []).map((variant, index) =>
    variantToRow(variant, product.id, index),
  );
  const { data: existing } = await db
    .from("product_variants")
    .select("id")
    .eq("product_id", product.id);
  const keep = new Set(variantRows.map((v) => v.id));
  const toDelete = (existing ?? []).map((v) => v.id).filter((id) => !keep.has(id));
  if (toDelete.length) {
    const { error: delError } = await db.from("product_variants").delete().in("id", toDelete);
    if (delError) throw delError;
  }
  if (variantRows.length) {
    const { error: varError } = await db.from("product_variants").upsert(variantRows);
    if (varError) throw varError;
  }
  return product;
}

export async function deleteProductsByIds(ids) {
  const db = await getAdminDb();
  const { error } = await db.from("products").delete().in("id", ids);
  if (error) throw error;
}

export async function setProductsStatus(ids, status) {
  const db = await getAdminDb();
  const { data, error } = await db
    .from("products")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", ids)
    .select("id");
  if (error) throw error;
  return data?.length ?? 0;
}

export async function updateVariantStock(productId, variantId, stock) {
  const db = await getAdminDb();
  const { error: varError } = await db
    .from("product_variants")
    .update({ stock })
    .eq("id", variantId)
    .eq("product_id", productId);
  if (varError) throw varError;

  const product = await getProductById(productId);
  if (!product) return null;
  const row = productToRow(product);
  const { error } = await db
    .from("products")
    .update({
      stock: row.stock,
      price: row.price,
      price_max: row.price_max,
      sku: row.sku,
      ram: row.ram,
      ssd: row.ssd,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
  if (error) throw error;
  return product;
}

export async function setLowStockThreshold(value) {
  const db = await getAdminDb();
  const { error } = await db.from("settings").upsert({ id: 1, low_stock_threshold: value });
  if (error) throw error;
}

export async function setOrderStatus(id, status) {
  const db = await getAdminDb();
  const { data, error } = await db
    .from("orders")
    .update({ status })
    .eq("id", id)
    .select("*, order_items(*)")
    .maybeSingle();
  if (error) throw error;
  return data ? mapOrder(data, data.order_items) : null;
}

export async function countStaffUsers() {
  const db = await getAdminDb();
  const { count, error } = await db
    .from("profiles")
    .select("*", { count: "exact", head: true })
    .neq("role", "customer");
  if (error) throw error;
  return count ?? 0;
}

export async function getStaffByEmail(email) {
  const db = await getAdminDb();
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("email", email.toLowerCase())
    .neq("role", "customer")
    .maybeSingle();
  if (error) throw error;
  return mapStaffUser(data);
}

export async function getStaffById(id) {
  const db = await getAdminDb();
  const { data, error } = await db
    .from("profiles")
    .select("*")
    .eq("id", id)
    .neq("role", "customer")
    .maybeSingle();
  if (error) throw error;
  return mapStaffUser(data);
}

export async function updateStaffProfile(id, patch) {
  const db = await getAdminDb();
  const row = {};
  if (patch.name != null) row.full_name = patch.name;
  if (patch.role != null) row.role = patch.role;
  if (patch.status != null) row.status = patch.status;
  if (patch.lastLoginAt != null) row.last_login_at = patch.lastLoginAt;
  if (patch.email != null) row.email = patch.email;
  const { data, error } = await db.from("profiles").update(row).eq("id", id).select("*").maybeSingle();
  if (error) throw error;
  return mapStaffUser(data);
}

export async function deleteStaffProfile(id) {
  const admin = await getAdminDb();
  const { error: profileError } = await admin.from("profiles").delete().eq("id", id);
  if (profileError) throw profileError;
  const { error } = await admin.auth.admin.deleteUser(id);
  if (error) throw error;
}

export async function listPublishedProducts() {
  const db = createPublicClient();
  const { data, error } = await db
    .from("products")
    .select("*, product_variants(*)")
    .eq("status", "published")
    .order("featured", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) =>
    mapProduct(
      row,
      (row.product_variants ?? []).sort((a, b) => a.sort_order - b.sort_order),
    ),
  );
}
