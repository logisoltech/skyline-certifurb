// ---------------------------------------------------------------------------
// Client-side account store.
//
// DEMO ONLY: there is no backend yet, so accounts, the session, wishlists,
// addresses and orders all live in this browser's localStorage. Passwords are
// salted + hashed (SHA-256) rather than stored in plain text, but this is NOT
// real security: anyone with access to the browser can read or edit the data.
//
// Every page talks to the exports below, never to localStorage directly, so
// when a real backend exists you only need to re-implement this file.
// ---------------------------------------------------------------------------

import { useSyncExternalStore } from "react";
import {
  DEMO_ADDRESSES,
  DEMO_ORDERS,
  DEMO_WISHLIST,
} from "../data/orders";

const STORAGE_KEY = "certifurb:v1";

export const DEMO_ACCOUNT = {
  email: "demo@certifurb.com",
  password: "Demo@1234",
};

const DEFAULT_PREFS = {
  orderEmails: true,
  whatsappUpdates: true,
  offers: false,
};

const EMPTY_DATA = Object.freeze({
  wishlist: [],
  addresses: [],
  orders: [],
  prefs: DEFAULT_PREFS,
});

// `ready` is false on the server and during hydration, so pages can show a
// skeleton instead of flashing the wrong signed-in/out state.
const SERVER_STATE = { ready: false, users: [], session: null, data: {} };
const EMPTY_STATE = { ready: true, users: [], session: null, data: {} };

let cachedRaw;
let cachedState = EMPTY_STATE;
const listeners = new Set();

function readState() {
  let raw = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage blocked (private mode, etc.): behave as signed out.
  }
  if (raw === cachedRaw) return cachedState;
  cachedRaw = raw;
  try {
    cachedState = raw ? { ...EMPTY_STATE, ...JSON.parse(raw), ready: true } : EMPTY_STATE;
  } catch {
    cachedState = EMPTY_STATE;
  }
  return cachedState;
}

function writeState(next) {
  const { ready: _ready, ...persisted } = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
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

const useStore = () =>
  useSyncExternalStore(subscribe, readState, () => SERVER_STATE);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function hashPassword(password, salt) {
  const bytes = new TextEncoder().encode(`${salt}:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const normalizeEmail = (email) => String(email ?? "").trim().toLowerCase();

const publicUser = ({ id, name, email, phone, createdAt }) => ({
  id,
  name,
  email,
  phone,
  createdAt,
});

// Only allow same-site redirects after login (blocks open-redirects).
export function safeNext(path, fallback = "/account") {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
    ? path
    : fallback;
}

function patchUserData(userId, updater) {
  const state = readState();
  const current = { ...EMPTY_DATA, ...state.data[userId] };
  writeState({
    ...state,
    data: { ...state.data, [userId]: updater(current) },
  });
}

async function ensureDemoUser() {
  const state = readState();
  if (state.users.some((u) => u.email === DEMO_ACCOUNT.email)) return;
  const salt = "demo";
  const demo = {
    id: "demo-user",
    name: "Ahmed Al Mansoori",
    email: DEMO_ACCOUNT.email,
    phone: "+971 50 123 4567",
    createdAt: "2026-06-14T09:00:00.000Z",
    salt,
    passwordHash: await hashPassword(DEMO_ACCOUNT.password, salt),
  };
  const latest = readState();
  writeState({
    ...latest,
    users: [...latest.users, demo],
    data: {
      ...latest.data,
      [demo.id]: {
        wishlist: DEMO_WISHLIST,
        addresses: DEMO_ADDRESSES,
        orders: DEMO_ORDERS,
        prefs: DEFAULT_PREFS,
      },
    },
  });
}

// ---------------------------------------------------------------------------
// Auth actions
// ---------------------------------------------------------------------------

export async function signUp({ name, email, phone, password, offers }) {
  const cleanEmail = normalizeEmail(email);
  const state = readState();
  if (state.users.some((u) => u.email === cleanEmail)) {
    return { ok: false, error: "An account with this email already exists. Try signing in instead." };
  }
  const salt = crypto.randomUUID();
  const user = {
    id: crypto.randomUUID(),
    name: String(name).trim(),
    email: cleanEmail,
    phone: String(phone ?? "").trim(),
    createdAt: new Date().toISOString(),
    salt,
    passwordHash: await hashPassword(password, salt),
  };
  const latest = readState();
  const saved = writeState({
    ...latest,
    users: [...latest.users, user],
    session: user.id,
    data: {
      ...latest.data,
      [user.id]: { ...EMPTY_DATA, prefs: { ...DEFAULT_PREFS, offers: Boolean(offers) } },
    },
  });
  return saved
    ? { ok: true }
    : { ok: false, error: "Your browser is blocking storage, so we couldn't create the account." };
}

export async function signIn(email, password) {
  const cleanEmail = normalizeEmail(email);
  if (cleanEmail === DEMO_ACCOUNT.email) await ensureDemoUser();

  const state = readState();
  const user = state.users.find((u) => u.email === cleanEmail);
  const genericError = { ok: false, error: "Incorrect email or password." };
  if (!user) return genericError;
  if ((await hashPassword(password, user.salt)) !== user.passwordHash) {
    return genericError;
  }
  writeState({ ...readState(), session: user.id });
  return { ok: true };
}

export function signOut() {
  writeState({ ...readState(), session: null });
}

export async function updateProfile({ name, email, phone }) {
  const state = readState();
  const cleanEmail = normalizeEmail(email);
  if (state.users.some((u) => u.email === cleanEmail && u.id !== state.session)) {
    return { ok: false, error: "That email is already used by another account." };
  }
  writeState({
    ...state,
    users: state.users.map((u) =>
      u.id === state.session
        ? { ...u, name: String(name).trim(), email: cleanEmail, phone: String(phone ?? "").trim() }
        : u,
    ),
  });
  return { ok: true };
}

export async function changePassword(currentPassword, newPassword) {
  const state = readState();
  const user = state.users.find((u) => u.id === state.session);
  if (!user) return { ok: false, error: "You need to be signed in." };
  if ((await hashPassword(currentPassword, user.salt)) !== user.passwordHash) {
    return { ok: false, error: "Your current password is incorrect." };
  }
  const salt = crypto.randomUUID();
  const passwordHash = await hashPassword(newPassword, salt);
  writeState({
    ...readState(),
    users: readState().users.map((u) =>
      u.id === user.id ? { ...u, salt, passwordHash } : u,
    ),
  });
  return { ok: true };
}

export function deleteAccount() {
  const state = readState();
  const { [state.session]: _removed, ...data } = state.data;
  writeState({
    ...state,
    users: state.users.filter((u) => u.id !== state.session),
    session: null,
    data,
  });
}

// ---------------------------------------------------------------------------
// Per-account data actions (wishlist, addresses, preferences)
// ---------------------------------------------------------------------------

export function toggleWishlist(slug) {
  const { session } = readState();
  if (!session) return;
  patchUserData(session, (d) => ({
    ...d,
    wishlist: d.wishlist.includes(slug)
      ? d.wishlist.filter((s) => s !== slug)
      : [slug, ...d.wishlist],
  }));
}

export function saveAddress(address) {
  const { session } = readState();
  if (!session) return;
  patchUserData(session, (d) => {
    const id = address.id ?? crypto.randomUUID();
    const exists = d.addresses.some((a) => a.id === id);
    const makeDefault = address.isDefault || d.addresses.length === 0;
    const next = { ...address, id, isDefault: makeDefault };
    let addresses = exists
      ? d.addresses.map((a) => (a.id === id ? next : a))
      : [...d.addresses, next];
    if (makeDefault) {
      addresses = addresses.map((a) => ({ ...a, isDefault: a.id === id }));
    }
    return { ...d, addresses };
  });
}

export function deleteAddress(id) {
  const { session } = readState();
  if (!session) return;
  patchUserData(session, (d) => {
    const addresses = d.addresses.filter((a) => a.id !== id);
    if (addresses.length && !addresses.some((a) => a.isDefault)) {
      addresses[0] = { ...addresses[0], isDefault: true };
    }
    return { ...d, addresses };
  });
}

export function setDefaultAddress(id) {
  const { session } = readState();
  if (!session) return;
  patchUserData(session, (d) => ({
    ...d,
    addresses: d.addresses.map((a) => ({ ...a, isDefault: a.id === id })),
  }));
}

export function savePrefs(prefs) {
  const { session } = readState();
  if (!session) return;
  patchUserData(session, (d) => ({ ...d, prefs: { ...d.prefs, ...prefs } }));
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

// status: "loading" (server / first paint) | "authenticated" | "anonymous"
export function useAccount() {
  const state = useStore();
  const found = state.session
    ? state.users.find((u) => u.id === state.session)
    : null;

  if (!state.ready) {
    return { status: "loading", user: null, data: EMPTY_DATA };
  }
  if (!found) {
    return { status: "anonymous", user: null, data: EMPTY_DATA };
  }
  return {
    status: "authenticated",
    user: publicUser(found),
    data: { ...EMPTY_DATA, ...state.data[found.id] },
  };
}
