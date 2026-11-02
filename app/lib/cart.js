// ---------------------------------------------------------------------------
// Client-side cart store.
//
// DEMO ONLY: the cart lives in this browser's localStorage (works for guests
// and signed-in users alike). Only { slug, variantId, qty } is stored; names
// and prices are always read from the catalogue so they can never go stale.
// When a real backend exists, re-implement this file and the pages won't
// need to change.
// ---------------------------------------------------------------------------

import { useMemo, useSyncExternalStore } from "react";
import { useCatalog } from "../components/CatalogProvider";

const STORAGE_KEY = "certifurb:cart:v1";

// Renewed stock is one-off, so keep quantities modest.
export const MAX_QTY = 5;

// `ready` is false on the server and during hydration.
const SERVER_STATE = { ready: false, items: [] };
const EMPTY_STATE = { ready: true, items: [] };

let cachedRaw;
let cachedState = EMPTY_STATE;
const listeners = new Set();

const clampQty = (qty) => Math.min(MAX_QTY, Math.max(1, Math.floor(Number(qty) || 1)));

function sameLine(a, slug, variantId) {
  return a.slug === slug && a.variantId === variantId;
}

function readState() {
  let raw = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked: behave as an empty cart.
  }
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  try {
    const parsed = raw ? JSON.parse(raw) : null;
    const items = Array.isArray(parsed?.items)
      ? parsed.items
          .filter((i) => i && typeof i.slug === "string")
          .map((i) => ({
            slug: i.slug,
            variantId: typeof i.variantId === "string" && i.variantId ? i.variantId : null,
            qty: clampQty(i.qty),
          }))
      : [];
    cachedState = items.length ? { ready: true, items } : EMPTY_STATE;
  } catch {
    cachedState = EMPTY_STATE;
  }
  return cachedState;
}

function writeItems(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ items }));
  } catch {
    return false;
  }
  listeners.forEach((listener) => listener());
  return true;
}

function subscribe(listener) {
  listeners.add(listener);
  const onStorage = (event) => {
    if (event.key === STORAGE_KEY || event.key === null) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function pickVariant(product, variantId) {
  const variants = product.variants ?? [];
  if (variantId) return variants.find((v) => v.id === variantId) ?? null;
  return variants[0] ?? null;
}

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------

export function addToCart(slug, variantId, qty = 1) {
  if (typeof slug !== "string" || !slug) return false;
  const id = typeof variantId === "string" && variantId ? variantId : null;
  const { items } = readState();
  const existing = items.find((i) => sameLine(i, slug, id));
  return writeItems(
    existing
      ? items.map((i) => (sameLine(i, slug, id) ? { ...i, qty: clampQty(i.qty + qty) } : i))
      : [...items, { slug, variantId: id, qty: clampQty(qty) }],
  );
}

export function setQuantity(slug, variantId, qty) {
  const { items } = readState();
  writeItems(items.map((i) => (sameLine(i, slug, variantId) ? { ...i, qty: clampQty(qty) } : i)));
}

export function removeFromCart(slug, variantId) {
  const { items } = readState();
  writeItems(items.filter((i) => !sameLine(i, slug, variantId)));
}

export function clearCart() {
  writeItems([]);
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// Returns { ready, lines, count, subtotal }. Each line is
// { product, variant, qty, max, lineTotal }. Items whose product left the
// catalogue or whose option went out of stock are skipped.
export function useCart() {
  const state = useSyncExternalStore(subscribe, readState, () => SERVER_STATE);
  const catalog = useCatalog();

  return useMemo(() => {
    const lines = state.items
      .map(({ slug, variantId, qty }) => {
        const product = catalog.find((p) => p.slug === slug);
        if (!product || !product.inStock) return null;
        const variant = pickVariant(product, variantId);
        if (!variant || !variant.inStock) return null;
        const max = Math.max(1, Math.min(MAX_QTY, variant.stock ?? MAX_QTY));
        const clamped = Math.min(qty, max);
        return {
          product,
          variant,
          qty: clamped,
          max,
          lineTotal: variant.price * clamped,
        };
      })
      .filter(Boolean);
    return {
      ready: state.ready,
      lines,
      count: lines.reduce((sum, l) => sum + l.qty, 0),
      subtotal: lines.reduce((sum, l) => sum + l.lineTotal, 0),
    };
  }, [state, catalog]);
}
