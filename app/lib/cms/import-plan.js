// Decides what a CSV import would do, row by row, without changing anything.
// The browser uses it for the preview; the server runs it again on submit and
// only trusts its own result.
//
// Rows that share a slug become options on one product (8GB vs 16GB, etc.).
// A row whose SKU already exists updates that option; a new SKU on an
// existing slug is added as another option.

import { migrateProduct, skuMap, upsertVariant } from "./product-model";
import { normalizeProduct, normalizeVariant, slugify } from "./product-schema";

const key = (v) => String(v ?? "").trim().toLowerCase();

function variantInput(input) {
  return {
    sku: input.sku,
    ram: input.ram,
    ssd: input.ssd,
    price: input.price,
    stock: input.stock,
  };
}

/**
 * @param rows      [{ line, input }] from csvToInputs()
 * @param products  current products (full records)
 * @param mode      "upsert" (create new + update existing) | "create" (skip existing)
 */
export function planImport(rows, products, mode = "upsert") {
  const catalog = products.map((p) => migrateProduct(p));
  const bySku = skuMap(catalog);
  const bySlug = new Map(catalog.map((p) => [key(p.slug), p]));

  const takenSlugs = new Set(catalog.map((p) => key(p.slug)));
  const seenSku = new Map();
  const fileBySlug = new Map();
  const fileByProductId = new Map();
  const results = [];

  for (const { line, input } of rows) {
    const skuKey = key(input.sku);
    const slugKey = key(input.slug) || key(slugify(input.title || ""));
    const existing = (skuKey && bySku.get(skuKey)) || (slugKey && bySlug.get(slugKey)) || null;

    const base = { line, title: input.title || existing?.title || "", existingId: existing?.id ?? null };

    if (skuKey && seenSku.has(skuKey)) {
      results.push({
        ...base,
        action: "error",
        errors: [`Duplicate SKU in this file (also on line ${seenSku.get(skuKey)}).`],
      });
      continue;
    }
    if (skuKey) seenSku.set(skuKey, line);

    const priorIndex =
      (existing?.id && fileByProductId.has(existing.id) ? fileByProductId.get(existing.id) : undefined) ??
      (slugKey && fileBySlug.has(slugKey) ? fileBySlug.get(slugKey) : undefined);

    if (priorIndex !== undefined) {
      const prior = results[priorIndex];
      if (!prior || prior.action === "error" || !prior.value) {
        results.push({ ...base, action: "error", errors: ["The product this option belongs to has errors."] });
        continue;
      }
      const { value: variant, errors: variantErrors } = normalizeVariant(
        variantInput(input),
        prior.value.variants.length,
      );
      const messages = Object.values(variantErrors);
      if (skuKey && bySku.has(skuKey)) {
        messages.push(`SKU "${variant.sku}" is used by another product.`);
      }
      const combo = `${variant.ram}|${variant.ssd}|${(variant.processor || "").toLowerCase()}`;
      if (prior.value.variants.some((v) => `${v.ram}|${v.ssd}|${(v.processor || "").toLowerCase()}` === combo)) {
        messages.push("Another option on this product already uses this RAM and storage.");
      }
      if (messages.length > 0) {
        results.push({ ...base, title: prior.value.title, action: "error", errors: messages });
        continue;
      }
      prior.value = upsertVariant(prior.value, variant);
      if (skuKey) bySku.set(skuKey, { id: existing?.id ?? `__new_${priorIndex}`, title: prior.value.title });
      results.push({
        ...base,
        title: prior.value.title,
        action: "skip",
        errors: [],
        note: `Added as an option on line ${prior.line}.`,
      });
      continue;
    }

    if (existing && mode === "create") {
      results.push({ ...base, action: "skip", errors: [], note: "Already exists, skipped." });
      continue;
    }

    const { value, errors } = normalizeProduct(input, existing);
    const messages = Object.values(errors);

    if (!existing && !input.slug && value.slug) {
      let candidate = value.slug;
      let n = 2;
      while (takenSlugs.has(candidate) || fileBySlug.has(candidate)) {
        candidate = `${slugify(value.slug).slice(0, 110)}-${n++}`;
      }
      value.slug = candidate;
    }

    const otherWithSlug = bySlug.get(key(value.slug));
    if (value.slug && otherWithSlug && otherWithSlug.id !== existing?.id) {
      messages.push(`Slug "${value.slug}" is used by another product.`);
    }

    for (const variant of value.variants) {
      const other = bySku.get(key(variant.sku));
      if (variant.sku && other && other.id !== existing?.id) {
        messages.push(`SKU "${variant.sku}" is used by another product.`);
      }
    }

    if (messages.length > 0) {
      results.push({ ...base, title: value.title || base.title, action: "error", errors: messages });
      continue;
    }

    // Updating an existing listing must keep sibling options; the CSV row
    // only describes one of them.
    const next = existing
      ? upsertVariant(
          {
            ...existing,
            ...value,
            images: input.image ? value.images : existing.images,
            variants: existing.variants,
          },
          value.variants[0],
        )
      : value;

    const action = existing ? "update" : "create";
    const index = results.length;
    results.push({ ...base, title: next.title, action, errors: [], value: next });

    if (next.slug) fileBySlug.set(key(next.slug), index);
    if (existing?.id) fileByProductId.set(existing.id, index);
    for (const variant of next.variants) {
      if (variant.sku) bySku.set(key(variant.sku), existing ?? { id: `__new_${index}`, title: next.title });
    }
    if (!existing && next.slug) {
      bySlug.set(key(next.slug), { id: `__new_${index}`, slug: next.slug, title: next.title });
    }
  }

  const summary = { create: 0, update: 0, skip: 0, error: 0 };
  for (const r of results) summary[r.action]++;
  return { results, summary };
}
