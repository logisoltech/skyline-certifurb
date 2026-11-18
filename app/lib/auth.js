// ---------------------------------------------------------------------------
// Storefront account client. Session + account data live in Supabase; this
// module keeps the same exports the UI already uses.
// ---------------------------------------------------------------------------

"use client";

import { useSyncExternalStore } from "react";
import { createClient } from "./supabase/client";
import {
  loadAccountBundle,
  storeChangePassword,
  storeDeleteAccount,
  storeDeleteAddress,
  storeSaveAddress,
  storeSavePrefs,
  storeSetDefaultAddress,
  storeSignIn,
  storeSignOut,
  storeSignUp,
  storeToggleWishlist,
  storeUpdateProfile,
} from "./store/account-actions";

export const DEMO_ACCOUNT = {
  email: "demo@certifurb.com",
  password: "Demo@1234",
};

const EMPTY_DATA = Object.freeze({
  wishlist: [],
  addresses: [],
  orders: [],
  prefs: {
    orderEmails: true,
    whatsappUpdates: true,
    offers: false,
  },
});

const SERVER_SNAPSHOT = { ready: false, status: "loading", user: null, data: EMPTY_DATA };
let snapshot = SERVER_SNAPSHOT;
const listeners = new Set();
let started = false;
let loadSeq = 0;

function emit() {
  listeners.forEach((listener) => listener());
}

function setSnapshot(next) {
  snapshot = next;
  emit();
}

async function refreshAccount() {
  const seq = ++loadSeq;
  try {
    const bundle = await loadAccountBundle();
    if (seq !== loadSeq) return;
    setSnapshot({
      ready: true,
      status: bundle.status,
      user: bundle.user,
      data: bundle.data ?? EMPTY_DATA,
    });
  } catch {
    if (seq !== loadSeq) return;
    setSnapshot({
      ready: true,
      status: "anonymous",
      user: null,
      data: EMPTY_DATA,
    });
  }
}

function ensureStarted() {
  if (started || typeof window === "undefined") return;
  started = true;
  const supabase = createClient();
  supabase.auth.onAuthStateChange(() => {
    refreshAccount();
  });
  refreshAccount();
}

function subscribe(listener) {
  ensureStarted();
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const getSnapshot = () => {
  ensureStarted();
  return snapshot;
};

export function safeNext(path, fallback = "/account") {
  return typeof path === "string" && path.startsWith("/") && !path.startsWith("//")
    ? path
    : fallback;
}

export async function signUp(input) {
  const result = await storeSignUp(input);
  if (result.ok) await refreshAccount();
  return result;
}

export async function signIn(email, password) {
  const result = await storeSignIn(email, password);
  if (result.ok) await refreshAccount();
  return result;
}

export async function signOut() {
  await storeSignOut();
  setSnapshot({
    ready: true,
    status: "anonymous",
    user: null,
    data: EMPTY_DATA,
  });
}

export async function updateProfile(input) {
  const result = await storeUpdateProfile(input);
  if (result.ok) await refreshAccount();
  return result;
}

export async function changePassword(currentPassword, newPassword) {
  return storeChangePassword(currentPassword, newPassword);
}

export async function deleteAccount() {
  await storeDeleteAccount();
  setSnapshot({
    ready: true,
    status: "anonymous",
    user: null,
    data: EMPTY_DATA,
  });
}

export async function toggleWishlist(slug) {
  if (snapshot.status !== "authenticated") return;
  // Optimistic update
  const has = snapshot.data.wishlist.includes(slug);
  setSnapshot({
    ...snapshot,
    data: {
      ...snapshot.data,
      wishlist: has
        ? snapshot.data.wishlist.filter((s) => s !== slug)
        : [slug, ...snapshot.data.wishlist],
    },
  });
  const result = await storeToggleWishlist(slug);
  if (!result.ok) await refreshAccount();
}

export async function saveAddress(address) {
  const result = await storeSaveAddress(address);
  if (result.ok) await refreshAccount();
  return result;
}

export async function deleteAddress(id) {
  const result = await storeDeleteAddress(id);
  if (result.ok) await refreshAccount();
  return result;
}

export async function setDefaultAddress(id) {
  const result = await storeSetDefaultAddress(id);
  if (result.ok) await refreshAccount();
  return result;
}

export async function savePrefs(prefs) {
  const result = await storeSavePrefs(prefs);
  if (result.ok) await refreshAccount();
  return result;
}

export function useAccount() {
  const state = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT);
  if (!state.ready) {
    return { status: "loading", user: null, data: EMPTY_DATA };
  }
  return {
    status: state.status,
    user: state.user,
    data: state.data ?? EMPTY_DATA,
  };
}

export function refreshStoreAccount() {
  return refreshAccount();
}
