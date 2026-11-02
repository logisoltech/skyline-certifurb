// The live catalogue the storefront reads (server side). It comes from the CMS
// store, is cached, and is refreshed instantly when the CMS calls
// updateTag("catalog") after a product change.

import { cacheLife, cacheTag } from "next/cache";
import { buildProduct } from "../data/products";
import { readStore } from "./cms/db";
import { migrateProduct, variantLabel } from "./cms/product-model";

function toStorefrontVariant(raw, product) {
  return {
    id: raw.id,
    sku: raw.sku,
    ram: raw.ram,
    ssd: raw.ssd,
    price: raw.price,
    stock: raw.stock,
    processor: raw.processor || "",
    generation: raw.generation ?? "",
    inStock: raw.stock > 0,
    label: variantLabel(raw, product),
  };
}

// Raw CMS record -> the shape the storefront components expect.
export function toStorefrontProduct(raw) {
  const product = migrateProduct(raw);
  const variants = (product.variants ?? []).map((v) => toStorefrontVariant(v, product));
  return buildProduct({
    slug: product.slug,
    title: product.title,
    brand: product.brand,
    processor: product.processor,
    generation: product.generation ?? null,
    ram: product.ram,
    ssd: product.ssd,
    rams: [...new Set(variants.map((v) => v.ram))],
    ssds: [...new Set(variants.map((v) => v.ssd))],
    screen: product.screen,
    touch: product.touch,
    twoInOne: product.twoInOne,
    condition: product.condition,
    price: product.price,
    priceMax: product.priceMax ?? product.price,
    warranty: product.warranty,
    image: product.image,
    images: product.images,
    uses: product.uses ?? [],
    featured: Boolean(product.featured),
    stock: product.stock,
    inStock: product.stock > 0,
    variants,
  });
}

// Published products only; drafts never reach the storefront.
export async function getCatalog() {
  "use cache";
  cacheTag("catalog");
  cacheLife("hours");

  const { products } = await readStore();
  return products.filter((p) => p.status === "published").map(toStorefrontProduct);
}
