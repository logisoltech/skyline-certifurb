"use server";

import { updateTag } from "next/cache";
import { authorize } from "../../lib/cms/auth";
import { MAX_IMPORT_ROWS } from "../../lib/cms/csv";
import {
  deleteProductsByIds,
  getProductById,
  listProducts,
  logActivity,
  newId,
  setProductsStatus,
  upsertProductRecord,
} from "../../lib/cms/db";
import { planImport } from "../../lib/cms/import-plan";
import { skuMap } from "../../lib/cms/product-model";
import { normalizeProduct } from "../../lib/cms/product-schema";

const refreshStorefront = () => updateTag("catalog");

function parseVariants(formData) {
  try {
    const parsed = JSON.parse(String(formData.get("variantsJson") ?? "[]"));
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function formInput(formData) {
  const text = (key) => String(formData.get(key) ?? "");
  return {
    title: text("title"),
    slug: text("slug"),
    brand: text("brand"),
    processor: text("processor"),
    generation: text("generation"),
    screen: text("screen"),
    touch: formData.get("touch") === "on",
    twoInOne: formData.get("twoInOne") === "on",
    condition: text("condition"),
    status: text("status"),
    featured: formData.get("featured") === "on",
    uses: formData.getAll("uses").map(String),
    warranty: text("warranty"),
    images: formData.getAll("images").map(String),
    variants: parseVariants(formData),
    __clearBlanks: true,
  };
}

function withVariantIds(value, existing) {
  const known = new Set((existing?.variants ?? []).map((v) => v.id));
  return {
    ...value,
    variants: value.variants.map((variant) => ({
      ...variant,
      id: variant.id && known.has(variant.id) ? variant.id : newId("var"),
    })),
  };
}

export async function saveProductAction(_prev, formData) {
  const auth = await authorize("products:write");
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get("id") ?? "");
  const input = formInput(formData);
  const products = await listProducts();
  const existing = id ? products.find((p) => p.id === id) : null;
  if (id && !existing) return { error: "That product no longer exists.", values: input };

  const { value: rawValue, errors } = normalizeProduct(input, existing);
  const takenSlug = products.find(
    (p) => p.slug.toLowerCase() === rawValue.slug?.toLowerCase() && p.id !== existing?.id,
  );
  if (rawValue.slug && takenSlug) errors.slug = "Another product already uses this slug.";

  const taken = skuMap(products, existing?.id);
  rawValue.variants.forEach((variant, index) => {
    const owner = taken.get(String(variant.sku).toLowerCase());
    if (owner) {
      errors[`variants.${index}.sku`] = `SKU already used on “${owner.title}”.`;
    }
  });
  if (Object.keys(errors).length > 0) return { fieldErrors: errors, values: input };

  const value = withVariantIds(rawValue, existing);
  const now = new Date().toISOString();
  if (existing) {
    const product = { ...existing, ...value, updatedAt: now };
    await upsertProductRecord(product);
    await logActivity(auth.user, "updated product", `${product.sku} · ${product.title}`);
    refreshStorefront();
    return { ok: true, message: "Product saved." };
  }

  const product = { id: newId("prod"), ...value, createdAt: now, updatedAt: now };
  await upsertProductRecord(product);
  await logActivity(auth.user, "added product", `${product.sku} · ${product.title}`);
  refreshStorefront();
  return { ok: true, created: true, id: product.id };
}

export async function deleteProductsAction(ids) {
  const auth = await authorize("products:write");
  if (!auth.ok) return auth;
  const wanted = Array.isArray(ids) ? ids.map(String) : [];
  if (wanted.length === 0) return { ok: false, error: "Nothing selected." };

  const products = await listProducts();
  const gone = products.filter((p) => wanted.includes(p.id));
  await deleteProductsByIds(wanted);
  if (gone.length) {
    await logActivity(
      auth.user,
      `deleted ${gone.length} product${gone.length === 1 ? "" : "s"}`,
      gone.map((p) => p.sku).join(", ").slice(0, 200),
    );
  }
  refreshStorefront();
  return { ok: true, count: gone.length };
}

export async function setProductsStatusAction(ids, status) {
  const auth = await authorize("products:write");
  if (!auth.ok) return auth;
  if (status !== "published" && status !== "draft") return { ok: false, error: "Invalid status." };
  const wanted = Array.isArray(ids) ? ids.map(String) : [];
  const count = await setProductsStatus(wanted, status);
  if (count) {
    await logActivity(
      auth.user,
      `${status === "published" ? "published" : "unpublished"} ${count} product${count === 1 ? "" : "s"}`,
    );
  }
  refreshStorefront();
  return { ok: true, count };
}

export async function importProductsAction(rows, mode) {
  const auth = await authorize("products:write");
  if (!auth.ok) return auth;
  if (!Array.isArray(rows) || rows.length === 0) return { ok: false, error: "The file has no rows." };
  if (rows.length > MAX_IMPORT_ROWS) {
    return { ok: false, error: `Import at most ${MAX_IMPORT_ROWS} rows at a time.` };
  }

  const safeRows = rows.map((row, i) => ({
    line: Number.isInteger(row?.line) ? row.line : i + 2,
    input: Object.fromEntries(
      Object.entries(row?.input ?? {})
        .filter(([, v]) => typeof v === "string")
        .map(([k, v]) => [k, v.slice(0, 500)]),
    ),
  }));

  const products = await listProducts();
  const { results, summary } = planImport(safeRows, products, mode === "create" ? "create" : "upsert");
  const now = new Date().toISOString();

  for (const r of results) {
    if (r.action === "create") {
      const product = withVariantIds(
        { id: newId("prod"), ...r.value, createdAt: now, updatedAt: now },
        null,
      );
      await upsertProductRecord(product);
    } else if (r.action === "update") {
      const existing = await getProductById(r.existingId);
      if (existing) {
        await upsertProductRecord({
          ...existing,
          ...withVariantIds(r.value, existing),
          updatedAt: now,
        });
      }
    }
  }

  if (summary.create + summary.update > 0) {
    await logActivity(
      auth.user,
      "imported products from CSV",
      `${summary.create} added, ${summary.update} updated, ${summary.error} with errors`,
    );
    refreshStorefront();
  }

  return {
    ok: true,
    summary,
    errors: results
      .filter((r) => r.action === "error")
      .map((r) => ({ line: r.line, title: r.title, messages: r.errors }))
      .slice(0, 100),
  };
}
