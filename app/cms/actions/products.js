"use server";

import { updateTag } from "next/cache";
import { authorize } from "../../lib/cms/auth";
import { MAX_IMPORT_ROWS } from "../../lib/cms/csv";
import { logActivity, mutateStore, newId } from "../../lib/cms/db";
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

// ---------------------------------------------------------------------------
// Create / update one product from the form.

export async function saveProductAction(_prev, formData) {
  const auth = await authorize("products:write");
  if (!auth.ok) return { error: auth.error };

  const id = String(formData.get("id") ?? "");
  const input = formInput(formData);

  const outcome = await mutateStore((data) => {
    const existing = id ? data.products.find((p) => p.id === id) : null;
    if (id && !existing) return { error: "That product no longer exists." };

    const { value: rawValue, errors } = normalizeProduct(input, existing);
    const takenSlug = data.products.find(
      (p) => p.slug.toLowerCase() === rawValue.slug?.toLowerCase() && p.id !== existing?.id,
    );
    if (rawValue.slug && takenSlug) errors.slug = "Another product already uses this slug.";

    const taken = skuMap(data.products, existing?.id);
    rawValue.variants.forEach((variant, index) => {
      const owner = taken.get(String(variant.sku).toLowerCase());
      if (owner) {
        errors[`variants.${index}.sku`] = `SKU already used on “${owner.title}”.`;
      }
    });
    if (Object.keys(errors).length > 0) return { fieldErrors: errors };

    const value = withVariantIds(rawValue, existing);
    const now = new Date().toISOString();
    if (existing) {
      Object.assign(existing, value, { updatedAt: now });
      logActivity(data, auth.user, "updated product", `${existing.sku} · ${existing.title}`);
      return { ok: true, id: existing.id };
    }
    const product = { id: newId("prod"), ...value, createdAt: now, updatedAt: now };
    data.products.push(product);
    logActivity(data, auth.user, "added product", `${product.sku} · ${product.title}`);
    return { ok: true, id: product.id, created: true };
  });

  if (!outcome.ok) return { ...outcome, values: input };
  refreshStorefront();
  if (outcome.created) {
    // Return instead of redirect(): this action is called through
    // useActionState, which doesn't always follow a server redirect.
    return { ok: true, created: true, id: outcome.id };
  }
  return { ok: true, message: "Product saved." };
}

// ---------------------------------------------------------------------------
// Bulk actions from the products list.

export async function deleteProductsAction(ids) {
  const auth = await authorize("products:write");
  if (!auth.ok) return auth;
  const wanted = new Set(Array.isArray(ids) ? ids.map(String) : []);
  if (wanted.size === 0) return { ok: false, error: "Nothing selected." };

  const removed = await mutateStore((data) => {
    const gone = data.products.filter((p) => wanted.has(p.id));
    data.products = data.products.filter((p) => !wanted.has(p.id));
    if (gone.length) {
      logActivity(
        data,
        auth.user,
        `deleted ${gone.length} product${gone.length === 1 ? "" : "s"}`,
        gone.map((p) => p.sku).join(", ").slice(0, 200),
      );
    }
    return gone.length;
  });
  refreshStorefront();
  return { ok: true, count: removed };
}

export async function setProductsStatusAction(ids, status) {
  const auth = await authorize("products:write");
  if (!auth.ok) return auth;
  if (status !== "published" && status !== "draft") return { ok: false, error: "Invalid status." };
  const wanted = new Set(Array.isArray(ids) ? ids.map(String) : []);

  const count = await mutateStore((data) => {
    let changed = 0;
    for (const product of data.products) {
      if (wanted.has(product.id) && product.status !== status) {
        product.status = status;
        product.updatedAt = new Date().toISOString();
        changed++;
      }
    }
    if (changed) {
      logActivity(data, auth.user, `${status === "published" ? "published" : "unpublished"} ${changed} product${changed === 1 ? "" : "s"}`);
    }
    return changed;
  });
  refreshStorefront();
  return { ok: true, count };
}

// ---------------------------------------------------------------------------
// CSV import. The browser sends parsed rows; the server re-validates and
// re-plans everything itself and only writes rows it accepts.

export async function importProductsAction(rows, mode) {
  const auth = await authorize("products:write");
  if (!auth.ok) return auth;
  if (!Array.isArray(rows) || rows.length === 0) return { ok: false, error: "The file has no rows." };
  if (rows.length > MAX_IMPORT_ROWS) {
    return { ok: false, error: `Import at most ${MAX_IMPORT_ROWS} rows at a time.` };
  }

  // Only plain string values for known shapes ever reach the planner.
  const safeRows = rows.map((row, i) => ({
    line: Number.isInteger(row?.line) ? row.line : i + 2,
    input: Object.fromEntries(
      Object.entries(row?.input ?? {})
        .filter(([, v]) => typeof v === "string")
        .map(([k, v]) => [k, v.slice(0, 500)]),
    ),
  }));

  const result = await mutateStore((data) => {
    const { results, summary } = planImport(safeRows, data.products, mode === "create" ? "create" : "upsert");
    const now = new Date().toISOString();

    for (const r of results) {
      if (r.action === "create") {
        const product = withVariantIds({ id: newId("prod"), ...r.value, createdAt: now, updatedAt: now }, null);
        data.products.push(product);
      } else if (r.action === "update") {
        const existing = data.products.find((p) => p.id === r.existingId);
        if (existing) Object.assign(existing, withVariantIds(r.value, existing), { updatedAt: now });
      }
    }
    if (summary.create + summary.update > 0) {
      logActivity(
        data,
        auth.user,
        "imported products from CSV",
        `${summary.create} added, ${summary.update} updated, ${summary.error} with errors`,
      );
    }
    return {
      summary,
      errors: results
        .filter((r) => r.action === "error")
        .map((r) => ({ line: r.line, title: r.title, messages: r.errors }))
        .slice(0, 100),
    };
  });

  if (result.summary.create + result.summary.update > 0) refreshStorefront();
  return { ok: true, ...result };
}
