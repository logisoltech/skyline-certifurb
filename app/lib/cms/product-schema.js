// Product validation shared by the product form, the CSV preview (browser)
// and the server actions. The server always re-validates; the browser copy is
// only so people get instant feedback.

import {
  BRANDS,
  CONDITIONS,
  DEFAULT_WARRANTY,
  PLACEHOLDER_IMAGE,
  STATUSES,
  USES,
} from "./constants";
import { MAX_IMAGES, syncDerived } from "./product-model";

export const slugify = (text) =>
  String(text ?? "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/["'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);

const clean = (v) => (typeof v === "string" ? v.trim() : v);
const isBlank = (v) => v === undefined || v === null || String(v).trim() === "";

export function toBool(value) {
  if (typeof value === "boolean") return value;
  return /^(1|true|yes|y|on)$/i.test(String(value ?? "").trim());
}

function toInt(value) {
  const n = Number(String(value).replace(/[, ]/g, ""));
  return Number.isInteger(n) ? n : NaN;
}

function toNumber(value) {
  const n = Number(String(value).replace(/[, ]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

function toList(value) {
  const parts = Array.isArray(value) ? value : String(value ?? "").split(/[,;|]/);
  return [...new Set(parts.map((p) => String(p).trim().toLowerCase()).filter(Boolean))];
}

const IMAGE_PATTERN = /^\/[A-Za-z0-9._\-/]+$/;

function normalizeImage(src) {
  const image = String(src ?? "").trim() || PLACEHOLDER_IMAGE;
  if (!IMAGE_PATTERN.test(image) || image.includes("..")) return { error: true, image };
  return { error: false, image };
}

export function normalizeVariant(input, index, base = null) {
  const errors = {};
  const prefix = `variants.${index}`;
  const pick = (key, fallback) => {
    if (Object.hasOwn(input, key)) return isBlank(input[key]) ? fallback : clean(input[key]);
    return base?.[key] ?? fallback;
  };

  const sku = String(pick("sku", "")).trim().toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._-]{1,39}$/.test(sku)) {
    errors[`${prefix}.sku`] = "SKU must be 2–40 letters, numbers, dots, dashes or underscores.";
  }

  const ram = toInt(pick("ram", ""));
  if (!(ram >= 2 && ram <= 512)) errors[`${prefix}.ram`] = "RAM must be 2–512 GB.";

  const ssd = toInt(pick("ssd", ""));
  if (!(ssd >= 16 && ssd <= 16384)) errors[`${prefix}.ssd`] = "Storage must be 16–16384 GB.";

  const price = toInt(pick("price", ""));
  if (!(price >= 1 && price <= 100000)) errors[`${prefix}.price`] = "Price must be 1–100,000 AED.";

  const stock = toInt(Object.hasOwn(input, "stock") && !isBlank(input.stock) ? input.stock : (base?.stock ?? 0));
  if (!(stock >= 0 && stock <= 10000)) errors[`${prefix}.stock`] = "Stock must be 0–10,000.";

  let processor = String(pick("processor", "")).trim();
  let generation = null;
  if (!isBlank(input.generation) || (!Object.hasOwn(input, "generation") && !isBlank(base?.generation))) {
    const raw = Object.hasOwn(input, "generation") ? input.generation : base?.generation;
    if (!isBlank(raw)) {
      generation = toInt(raw);
      if (!(generation >= 1 && generation <= 20)) errors[`${prefix}.generation`] = "Generation must be 1–20, or blank.";
    }
  }

  return {
    value: {
      id: String(input.id || base?.id || ""),
      sku,
      ram,
      ssd,
      price,
      stock,
      processor,
      generation,
    },
    errors,
  };
}

function variantsFromInput(input, base) {
  if (Array.isArray(input.variants) && input.variants.length > 0) {
    return input.variants;
  }
  // CSV / legacy: one variant from the flat ram/ssd/price/stock/sku fields.
  const first = base?.variants?.[0];
  return [
    {
      id: first?.id || "",
      sku: input.sku ?? first?.sku ?? "",
      ram: input.ram ?? first?.ram ?? "",
      ssd: input.ssd ?? first?.ssd ?? "",
      price: input.price ?? first?.price ?? "",
      stock: input.stock ?? first?.stock ?? 0,
      processor: input.variantProcessor ?? "",
      generation: input.variantGeneration ?? "",
    },
  ];
}

/**
 * Validates + normalises raw product input (form fields or a CSV row).
 *
 * `base` is the existing product when updating: any field missing from
 * `input` keeps its current value. Returns { value, errors } where `errors`
 * maps field name -> message (empty when valid).
 */
export function normalizeProduct(input, base = null) {
  const errors = {};
  const has = (key) => Object.hasOwn(input, key) && !isBlank(input[key]);
  const pick = (key, fallback) => (has(key) ? clean(input[key]) : (base?.[key] ?? fallback));

  const title = String(pick("title", "")).trim();
  if (title.length < 5 || title.length > 200) {
    errors.title = "Title must be 5–200 characters.";
  }

  let slug = has("slug") ? slugify(input.slug) : (base?.slug ?? slugify(title));
  if (!slug) errors.slug = "Couldn't build a URL slug from the title.";

  const brand = String(pick("brand", "")).trim().toLowerCase();
  if (!BRANDS.includes(brand)) errors.brand = `Brand must be one of: ${BRANDS.join(", ")}.`;

  const processor = String(pick("processor", "")).trim();
  if (!processor) errors.processor = "Processor is required.";

  let generation = null;
  const rawGeneration = has("generation") ? input.generation : base?.generation;
  if (!isBlank(rawGeneration)) {
    generation = toInt(rawGeneration);
    if (!(generation >= 1 && generation <= 20)) errors.generation = "Generation must be 1–20, or blank.";
  }
  if (base && input.__clearBlanks && isBlank(input.generation)) generation = null;

  const screen = toNumber(pick("screen", ""));
  if (!(screen >= 7 && screen <= 20)) errors.screen = "Screen must be 7–20 inches.";

  const condition = String(pick("condition", ""));
  const conditionMatch = CONDITIONS.find((c) => c.toLowerCase() === condition.toLowerCase());
  if (!conditionMatch) errors.condition = `Condition must be one of: ${CONDITIONS.join(", ")}.`;

  const status = String(pick("status", "draft")).toLowerCase();
  if (!STATUSES.includes(status)) errors.status = "Status must be published or draft.";

  const uses =
    Array.isArray(input.uses) || has("uses") ? toList(input.uses) : (base?.uses ?? []);
  const badUse = uses.find((u) => !USES.includes(u));
  if (badUse) errors.uses = `Unknown use "${badUse}". Allowed: ${USES.join(", ")}.`;

  const warranty = String(pick("warranty", DEFAULT_WARRANTY)).trim().slice(0, 80) || DEFAULT_WARRANTY;

  let images;
  if (Array.isArray(input.images)) {
    images = input.images.map((src) => String(src || "").trim()).filter(Boolean);
  } else if (has("image")) {
    images = [String(input.image).trim()];
  } else {
    images = base?.images?.length ? [...base.images] : [pick("image", PLACEHOLDER_IMAGE)];
  }
  images = [...new Set(images)];
  if (images.length === 0) images = [PLACEHOLDER_IMAGE];
  if (images.length > MAX_IMAGES) errors.images = `At most ${MAX_IMAGES} photos.`;
  images = images.map((src) => {
    const { error, image } = normalizeImage(src);
    if (error) errors.images = "Each image must be a site path such as /dell.png or /uploads/….";
    return image;
  });

  const rawVariants = variantsFromInput(input, base);
  if (rawVariants.length === 0) {
    errors.variants = "Add at least one option (RAM, storage, price and stock).";
  }

  const variants = [];
  const seenSku = new Map();
  const seenCombo = new Set();
  rawVariants.forEach((raw, index) => {
    const baseVariant = base?.variants?.find((v) => v.id && v.id === raw.id) ?? base?.variants?.[index] ?? null;
    const { value, errors: variantErrors } = normalizeVariant(raw, index, baseVariant);
    Object.assign(errors, variantErrors);

    const skuKey = value.sku.toLowerCase();
    if (skuKey && seenSku.has(skuKey)) {
      errors[`variants.${index}.sku`] = `Duplicate SKU (also on option ${seenSku.get(skuKey) + 1}).`;
    }
    if (skuKey) seenSku.set(skuKey, index);

    const combo = `${value.ram}|${value.ssd}|${(value.processor || "").toLowerCase()}`;
    if (seenCombo.has(combo)) {
      errors[`variants.${index}.ram`] = "Another option already uses this RAM, storage and processor.";
    }
    seenCombo.add(combo);

    variants.push(value);
  });

  const value = syncDerived({
    slug,
    title,
    brand,
    processor,
    generation,
    screen,
    touch: has("touch") || typeof input.touch === "boolean" ? toBool(input.touch) : (base?.touch ?? false),
    twoInOne:
      has("twoInOne") || typeof input.twoInOne === "boolean"
        ? toBool(input.twoInOne)
        : (base?.twoInOne ?? false),
    condition: conditionMatch ?? condition,
    warranty,
    images,
    variants,
    status,
    featured:
      has("featured") || typeof input.featured === "boolean"
        ? toBool(input.featured)
        : (base?.featured ?? false),
    uses,
  });

  return { value, errors };
}
