// ---------------------------------------------------------------------------
// Server-only JSON file store for the CMS and the live catalogue.
//
// Data lives in `.data/store.json` next to the app (git-ignored). Writes are
// serialised through one queue and made atomic (write temp file, then rename),
// so concurrent requests can't corrupt it. This is a real, persistent backend
// for a single self-hosted Node server. It is NOT suitable for serverless
// hosting (read-only/ephemeral disk) or multiple instances: swap this one
// file for a database (Postgres, etc.) when you outgrow it. Every other CMS
// module only talks to readStore()/mutateStore().
//
// Never import this file from a Client Component.
// ---------------------------------------------------------------------------

import crypto from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { migrateProduct } from "./product-model";
import { buildSeed } from "./seed";

const DIR = path.join(process.cwd(), ".data");
const FILE = path.join(DIR, "store.json");

// Shared across module instances (dev bundling can load this file twice).
const globalState = (globalThis.__certifurbStore ??= { queue: Promise.resolve() });

async function save(data) {
  await fs.mkdir(DIR, { recursive: true });
  const tmp = `${FILE}.${process.pid}.${crypto.randomBytes(4).toString("hex")}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, FILE);
}

function migrateStore(data) {
  if (!data?.products) return { data, changed: false };
  let changed = false;
  data.products = data.products.map((product) => {
    const next = migrateProduct(product);
    if (
      JSON.stringify(next.variants) !== JSON.stringify(product.variants) ||
      JSON.stringify(next.images) !== JSON.stringify(product.images)
    ) {
      changed = true;
    }
    return next;
  });
  return { data, changed };
}

async function load() {
  try {
    const parsed = JSON.parse(await fs.readFile(FILE, "utf8"));
    const { data, changed } = migrateStore(parsed);
    if (changed) await save(data);
    return data;
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
    const seeded = buildSeed();
    await save(seeded);
    return seeded;
  }
}

// Reads wait for any write already in flight, so they never see a half state.
export function readStore() {
  return globalState.queue.then(load);
}

// `fn` receives the live data, mutates it in place and may return a result.
// If it throws, nothing is written.
export function mutateStore(fn) {
  const run = globalState.queue.then(async () => {
    const data = await load();
    const result = await fn(data);
    await save(data);
    return result;
  });
  globalState.queue = run.catch(() => {});
  return run;
}

export const newId = (prefix) => `${prefix}_${crypto.randomBytes(5).toString("hex")}`;

// Appends to the activity feed shown on the dashboard (newest first, capped).
export function logActivity(data, user, action, detail = "") {
  data.activity.unshift({
    id: newId("act"),
    at: new Date().toISOString(),
    userId: user?.id ?? null,
    userName: user?.name ?? "System",
    action,
    detail,
  });
  data.activity.length = Math.min(data.activity.length, 200);
}
