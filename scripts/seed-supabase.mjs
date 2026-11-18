/**
 * One-shot seed: products (+ sample customers/orders if SEED_SAMPLES=1).
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in env
 * (or .env.local). Run: npm run seed
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvLocal() {
  const path = resolve(process.cwd(), ".env.local");
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvLocal();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const { ALL_PRODUCTS } = await import("./seed-products.mjs");

const STOCK = [6, 4, 3, 5, 2, 8, 3, 2, 4, 0, 2, 0];

const products = ALL_PRODUCTS.map((p, i) => {
  const id = `prod_${String(i + 1).padStart(3, "0")}`;
  const sku = `CF-${p.brand.slice(0, 3).toUpperCase()}-${101 + i}`;
  const stock = p.inStock === false ? 0 : STOCK[i];
  return {
    product: {
      id,
      slug: p.slug,
      title: p.title,
      brand: p.brand,
      processor: p.processor,
      generation: p.generation,
      screen: p.screen,
      touch: Boolean(p.touch),
      two_in_one: Boolean(p.twoInOne),
      condition: p.condition,
      status: "published",
      featured: Boolean(p.featured),
      uses: p.uses ?? [],
      warranty: p.warranty,
      images: [p.image],
      sku,
      ram: p.ram,
      ssd: p.ssd,
      price: p.price,
      price_max: p.price,
      stock,
      image: p.image,
      created_at: "2026-10-01T08:00:00.000Z",
      updated_at: "2026-10-01T08:00:00.000Z",
    },
    variants: [
      {
        id: `${id}_v1`,
        product_id: id,
        sku,
        ram: p.ram,
        ssd: p.ssd,
        price: p.price,
        stock,
        processor: "",
        generation: null,
        sort_order: 0,
      },
    ],
  };
});

console.log(`Seeding ${products.length} products…`);

const { error: settingsError } = await admin
  .from("settings")
  .upsert({ id: 1, low_stock_threshold: 3 });
if (settingsError) {
  console.error(settingsError);
  process.exit(1);
}

for (const { product, variants } of products) {
  const { error } = await admin.from("products").upsert(product);
  if (error) {
    console.error("product", product.id, error);
    process.exit(1);
  }
  const { error: vError } = await admin.from("product_variants").upsert(variants);
  if (vError) {
    console.error("variants", product.id, vError);
    process.exit(1);
  }
}

console.log("Products seeded.");

if (process.env.SEED_SAMPLES === "1") {
  console.log("SEED_SAMPLES=1: creating sample customer auth users + orders…");
  // Sample customers require Auth users; skip if already present by email.
  const samples = [
    {
      email: "demo@certifurb.com",
      password: "Demo@1234",
      full_name: "Ahmed Al Mansoori",
      phone: "+971 50 123 4567",
      emirate: "Sharjah",
    },
  ];

  for (const sample of samples) {
    const { data: listed } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    let user = listed?.users?.find((u) => u.email === sample.email);
    if (!user) {
      const { data, error } = await admin.auth.admin.createUser({
        email: sample.email,
        password: sample.password,
        email_confirm: true,
        user_metadata: {
          full_name: sample.full_name,
          phone: sample.phone,
          role: "customer",
          status: "active",
        },
      });
      if (error) {
        console.error(error);
        process.exit(1);
      }
      user = data.user;
    }
    await admin
      .from("profiles")
      .update({
        full_name: sample.full_name,
        phone: sample.phone,
        emirate: sample.emirate,
        role: "customer",
        status: "active",
      })
      .eq("id", user.id);

    await admin.from("notification_prefs").upsert({
      user_id: user.id,
      order_emails: true,
      whatsapp_updates: true,
      offers: false,
    });
    console.log(`Sample customer ready: ${sample.email} / ${sample.password}`);
  }
}

console.log("Done.");
