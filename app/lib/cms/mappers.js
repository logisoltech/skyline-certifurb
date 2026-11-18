import { syncDerived } from "./product-model";

export function mapVariant(row) {
  if (!row) return null;
  return {
    id: row.id,
    sku: row.sku,
    ram: row.ram,
    ssd: row.ssd,
    price: Number(row.price),
    stock: Number(row.stock) || 0,
    processor: row.processor || "",
    generation: row.generation ?? "",
  };
}

export function mapProduct(row, variants = row?.product_variants) {
  if (!row) return null;
  const mapped = {
    id: row.id,
    slug: row.slug,
    title: row.title,
    brand: row.brand,
    processor: row.processor || "",
    generation: row.generation ?? null,
    screen: row.screen != null ? Number(row.screen) : null,
    touch: Boolean(row.touch),
    twoInOne: Boolean(row.two_in_one),
    condition: row.condition,
    status: row.status,
    featured: Boolean(row.featured),
    uses: row.uses ?? [],
    warranty: row.warranty,
    images: row.images?.length ? row.images : [row.image || "/dell.png"],
    variants: (variants ?? []).map(mapVariant).filter(Boolean),
    sku: row.sku,
    ram: row.ram,
    ssd: row.ssd,
    price: Number(row.price),
    priceMax: Number(row.price_max ?? row.price),
    stock: Number(row.stock) || 0,
    image: row.image || row.images?.[0] || "/dell.png",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
  return syncDerived(mapped);
}

export function productToRow(product) {
  const derived = syncDerived(product);
  return {
    id: derived.id,
    slug: derived.slug,
    title: derived.title,
    brand: derived.brand,
    processor: derived.processor || "",
    generation: derived.generation ?? null,
    screen: derived.screen ?? null,
    touch: Boolean(derived.touch),
    two_in_one: Boolean(derived.twoInOne),
    condition: derived.condition,
    status: derived.status,
    featured: Boolean(derived.featured),
    uses: derived.uses ?? [],
    warranty: derived.warranty,
    images: derived.images ?? [],
    sku: derived.sku || "",
    ram: derived.ram ?? null,
    ssd: derived.ssd ?? null,
    price: derived.price ?? 0,
    price_max: derived.priceMax ?? derived.price ?? 0,
    stock: derived.stock ?? 0,
    image: derived.image || "/dell.png",
    created_at: derived.createdAt,
    updated_at: derived.updatedAt,
  };
}

export function variantToRow(variant, productId, sortOrder = 0) {
  return {
    id: variant.id,
    product_id: productId,
    sku: variant.sku,
    ram: variant.ram ?? null,
    ssd: variant.ssd ?? null,
    price: variant.price ?? 0,
    stock: Number(variant.stock) || 0,
    processor: variant.processor || "",
    generation: variant.generation === "" || variant.generation == null ? null : variant.generation,
    sort_order: sortOrder,
  };
}

export function mapStaffUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    role: row.role,
    status: row.status,
    createdAt: row.created_at,
    lastLoginAt: row.last_login_at ?? null,
  };
}

export function mapCustomer(row) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.full_name,
    email: row.email,
    phone: row.phone || "",
    emirate: row.emirate || "",
    createdAt: row.created_at,
    sample: false,
  };
}

function orderEvents(status, placedAt) {
  const steps = ["placed", "preparing", "dispatched", "delivered"];
  if (status === "cancelled") {
    return [
      { step: "placed", at: placedAt, note: "We've received your order." },
      { step: "cancelled", at: placedAt, note: "This order was cancelled." },
    ];
  }
  const index = Math.max(0, steps.indexOf(status));
  return steps.slice(0, index + 1).map((step, i) => ({
    step,
    at: placedAt,
    note:
      i === 0
        ? "We've received your order."
        : step === "preparing"
          ? "Hardware inspection and preparation are in progress."
          : step === "dispatched"
            ? "Your laptop is on the way."
            : "Delivered. Enjoy your renewed laptop.",
  }));
}

export function mapOrder(row, items = row?.order_items) {
  if (!row) return null;
  const placedAt = row.placed_at;
  return {
    id: row.id,
    customerId: row.customer_id,
    placedAt,
    status: row.status,
    payment: row.payment,
    items: (items ?? []).map((item) => ({
      slug: item.slug,
      title: item.title,
      price: Number(item.price),
      qty: Number(item.qty),
      variantId: item.variant_id ?? null,
      sku: item.sku || "",
    })),
    total: Number(row.total),
    emirate: row.emirate || "",
    sample: Boolean(row.sample),
    customerName: row.customer_name || "",
    customerEmail: row.customer_email || "",
    customerPhone: row.customer_phone || "",
    address: {
      name: row.customer_name || "",
      phone: row.customer_phone || "",
      line: "",
      area: "",
      emirate: row.emirate || "",
    },
    events: orderEvents(row.status, placedAt),
    estimatedDelivery: null,
  };
}

export function mapActivity(row) {
  return {
    id: row.id,
    at: row.at,
    userId: row.user_id,
    userName: row.user_name,
    action: row.action,
    detail: row.detail || "",
  };
}

export function mapAddress(row) {
  return {
    id: row.id,
    label: row.label,
    name: row.name,
    phone: row.phone,
    // Storefront UI uses line / area; DB uses line1 / city.
    line: row.line1 || "",
    area: row.city || "",
    line1: row.line1 || "",
    line2: row.line2 || "",
    city: row.city || "",
    emirate: row.emirate,
    isDefault: Boolean(row.is_default),
  };
}
