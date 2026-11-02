// First-run contents of the store. The product list comes from the original
// placeholder catalogue; customers and orders are SAMPLE data so the
// dashboard isn't empty (the storefront has no checkout yet, so no real
// orders exist). Delete or replace them once real orders come in.

import crypto from "node:crypto";
import { ALL_PRODUCTS } from "../../data/products";

const STOCK = [6, 4, 3, 5, 2, 8, 3, 2, 4, 0, 2, 0];

function seedProducts() {
  return ALL_PRODUCTS.map((p, i) => {
    const id = `prod_${String(i + 1).padStart(3, "0")}`;
    const sku = `CF-${p.brand.slice(0, 3).toUpperCase()}-${101 + i}`;
    const stock = p.inStock === false ? 0 : STOCK[i];
    return {
      id,
      slug: p.slug,
      sku,
      title: p.title,
      brand: p.brand,
      processor: p.processor,
      generation: p.generation,
      ram: p.ram,
      ssd: p.ssd,
      screen: p.screen,
      touch: p.touch,
      twoInOne: p.twoInOne,
      condition: p.condition,
      price: p.price,
      warranty: p.warranty,
      image: p.image,
      images: [p.image],
      stock,
      variants: [
        {
          id: `${id}_v1`,
          sku,
          ram: p.ram,
          ssd: p.ssd,
          price: p.price,
          stock,
          processor: "",
          generation: "",
        },
      ],
      status: "published",
      featured: Boolean(p.featured),
      uses: p.uses,
      createdAt: "2026-10-01T08:00:00.000Z",
      updatedAt: "2026-10-01T08:00:00.000Z",
    };
  });
}

const CUSTOMERS = [
  ["cus_001", "Ahmed Al Mansoori", "demo@certifurb.com", "+971 50 123 4567", "Sharjah", "2026-06-14"],
  ["cus_002", "Fatima Al Zaabi", "fatima.alzaabi@example.com", "+971 52 411 0098", "Abu Dhabi", "2026-08-02"],
  ["cus_003", "Rohan Mehta", "rohan.mehta@example.com", "+971 55 902 3311", "Dubai", "2026-08-19"],
  ["cus_004", "Sara Khan", "sara.khan@example.com", "+971 50 774 2210", "Dubai", "2026-09-03"],
  ["cus_005", "Omar Haddad", "omar.haddad@example.com", "+971 56 330 8842", "Ajman", "2026-09-21"],
  ["cus_006", "Priya Nair", "priya.nair@example.com", "+971 54 618 5527", "Sharjah", "2026-10-05"],
  ["cus_007", "Khalid Al Suwaidi", "khalid.s@example.com", "+971 50 266 7103", "Ras Al Khaimah", "2026-10-14"],
  ["cus_008", "Mariam Yusuf", "mariam.yusuf@example.com", "+971 58 190 4476", "Dubai", "2026-10-27"],
].map(([id, name, email, phone, emirate, joined]) => ({
  id,
  name,
  email,
  phone,
  emirate,
  createdAt: `${joined}T09:00:00.000Z`,
  sample: true,
}));

// [id, customer, placed (UTC), status, payment, [[slug, qty], ...]]
const ORDERS = [
  ["CF-10520", "cus_002", "2026-10-12T06:20:00.000Z", "delivered", "Cash on Delivery", [["hp-elitebook-840-g7-core-i5", 1]]],
  ["CF-10521", "cus_003", "2026-10-15T10:05:00.000Z", "delivered", "Card", [["dell-latitude-7420-core-i7", 1]]],
  ["CF-10522", "cus_001", "2026-10-18T08:40:00.000Z", "delivered", "Tabby (4 payments)", [["lenovo-thinkpad-t490-core-i5", 2]]],
  ["CF-10523", "cus_004", "2026-10-21T12:15:00.000Z", "delivered", "Card", [["apple-macbook-pro-13-m1-2020", 1]]],
  ["CF-10524", "cus_005", "2026-10-24T07:30:00.000Z", "cancelled", "Cash on Delivery", [["lenovo-thinkpad-x1-carbon-gen-9", 1]]],
  ["CF-10525", "cus_006", "2026-10-27T09:10:00.000Z", "dispatched", "Tabby (4 payments)", [["microsoft-surface-laptop-3-core-i5", 1]]],
  ["CF-10526", "cus_007", "2026-10-29T11:45:00.000Z", "dispatched", "Cash on Delivery", [["lenovo-thinkpad-p15-gen-2-rtx", 1]]],
  ["CF-10527", "cus_001", "2026-10-31T05:50:00.000Z", "preparing", "Cash on Delivery", [["lenovo-thinkpad-t14-gen-2-ryzen-5-pro", 1]]],
  ["CF-10528", "cus_008", "2026-11-01T08:25:00.000Z", "preparing", "Card", [["dell-latitude-5320-core-i5-touch", 1], ["hp-elitebook-840-g7-core-i5", 1]]],
  ["CF-10529", "cus_003", "2026-11-02T06:05:00.000Z", "placed", "Tabby (4 payments)", [["lenovo-thinkpad-l13-yoga-gen-2", 1]]],
];

function seedOrders() {
  const customers = new Map(CUSTOMERS.map((c) => [c.id, c]));
  const products = new Map(ALL_PRODUCTS.map((p) => [p.slug, p]));
  return ORDERS.map(([id, customerId, placedAt, status, payment, lines]) => {
    const customer = customers.get(customerId);
    const items = lines.map(([slug, qty]) => {
      const product = products.get(slug);
      return { slug, title: product.title, price: product.price, qty };
    });
    return {
      id,
      customerId,
      placedAt,
      status,
      payment,
      items,
      total: items.reduce((sum, i) => sum + i.price * i.qty, 0),
      emirate: customer.emirate,
      sample: true,
    };
  });
}

export function buildSeed() {
  return {
    meta: {
      // Signs CMS session cookies. Set CMS_SECRET in the environment to
      // override it (recommended in production).
      secret: crypto.randomBytes(32).toString("hex"),
      createdAt: new Date().toISOString(),
    },
    settings: { lowStockThreshold: 3 },
    users: [],
    products: seedProducts(),
    customers: CUSTOMERS,
    orders: seedOrders(),
    activity: [],
  };
}
