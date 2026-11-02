// Shared product/variant/image helpers. No Node APIs — safe for the CMS form,
// CSV planner and the storefront catalogue mapper.

import { PLACEHOLDER_IMAGE } from "./constants";

export const MAX_IMAGES = 8;

export function emptyVariant() {
  return {
    id: "",
    sku: "",
    ram: "",
    ssd: "",
    price: "",
    stock: "0",
    processor: "",
    generation: "",
  };
}

export function variantLabel(variant, product) {
  const ram = variant.ram ? `${variant.ram}GB RAM` : null;
  const ssd = variant.ssd ? (variant.ssd >= 1024 ? `${variant.ssd / 1024}TB SSD` : `${variant.ssd}GB SSD`) : null;
  const cpu = variant.processor && variant.processor !== product?.processor ? variant.processor : null;
  return [cpu, ram, ssd].filter(Boolean).join(" · ") || variant.sku || "Option";
}

// Fills in images[] / variants[] for records saved before those existed, and
// keeps the flat sku/price/stock/image fields in sync so lists and inventory
// don't have to know about variants.
export function migrateProduct(product) {
  if (!product) return product;

  const images = (Array.isArray(product.images) ? product.images : [])
    .map((src) => String(src || "").trim())
    .filter(Boolean);
  if (images.length === 0 && product.image) images.push(product.image);
  if (images.length === 0) images.push(PLACEHOLDER_IMAGE);

  let variants = Array.isArray(product.variants) ? product.variants.filter(Boolean) : [];
  if (variants.length === 0) {
    variants = [
      {
        id: `${product.id || "prod"}_v1`,
        sku: product.sku,
        ram: product.ram,
        ssd: product.ssd,
        price: product.price,
        stock: product.stock ?? 0,
        processor: "",
        generation: "",
      },
    ];
  } else {
    variants = variants.map((v, i) => ({
      id: v.id || `${product.id || "prod"}_v${i + 1}`,
      sku: v.sku,
      ram: v.ram,
      ssd: v.ssd,
      price: v.price,
      stock: v.stock ?? 0,
      processor: v.processor ?? "",
      generation: v.generation ?? "",
    }));
  }

  return syncDerived({ ...product, images, variants });
}

// sku / ram / ssd / price / stock / image stay on the product so older
// screens (dashboard, CSV, lists) keep working.
export function syncDerived(product) {
  const variants = product.variants ?? [];
  const first = variants[0] ?? {};
  const stock = variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  const prices = variants.map((v) => Number(v.price)).filter((n) => Number.isFinite(n));
  return {
    ...product,
    images: product.images?.length ? product.images : [PLACEHOLDER_IMAGE],
    image: product.images?.[0] || product.image || PLACEHOLDER_IMAGE,
    sku: first.sku ?? product.sku,
    ram: first.ram ?? product.ram,
    ssd: first.ssd ?? product.ssd,
    price: prices.length ? Math.min(...prices) : product.price,
    priceMax: prices.length ? Math.max(...prices) : product.price,
    stock,
  };
}

export function skuMap(products, exceptId = null) {
  const map = new Map();
  for (const product of products) {
    if (product.id === exceptId) continue;
    for (const variant of product.variants || []) {
      const sku = String(variant.sku ?? "").trim().toLowerCase();
      if (sku) map.set(sku, product);
    }
    const fallback = String(product.sku ?? "").trim().toLowerCase();
    if (fallback && !map.has(fallback)) map.set(fallback, product);
  }
  return map;
}

export function flattenInventory(products) {
  return products.flatMap((product) => {
    const variants = product.variants?.length
      ? product.variants
      : [{ id: product.id, sku: product.sku, ram: product.ram, ssd: product.ssd, price: product.price, stock: product.stock }];
    return variants.map((variant) => ({
      key: `${product.id}:${variant.id}`,
      productId: product.id,
      variantId: variant.id,
      title: product.title,
      slug: product.slug,
      brand: product.brand,
      status: product.status,
      image: product.image,
      sku: variant.sku,
      ram: variant.ram,
      ssd: variant.ssd,
      price: variant.price,
      stock: variant.stock,
      label: variantLabel(variant, product),
    }));
  });
}

// Add or replace a variant on an existing product (CSV upsert by SKU).
export function upsertVariant(product, variant) {
  const sku = String(variant.sku ?? "").trim().toLowerCase();
  const variants = [...(product.variants ?? [])];
  const index = variants.findIndex((v) => String(v.sku ?? "").trim().toLowerCase() === sku);
  if (index >= 0) {
    variants[index] = { ...variants[index], ...variant, id: variants[index].id };
  } else {
    variants.push(variant);
  }
  return syncDerived({ ...product, variants });
}
