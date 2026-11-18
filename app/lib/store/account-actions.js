"use server";

import { revalidatePath } from "next/cache";
import { mapAddress, mapOrder } from "../cms/mappers";
import { createAdminClient } from "../supabase/admin";
import { createClient } from "../supabase/server";

const DEFAULT_PREFS = {
  orderEmails: true,
  whatsappUpdates: true,
  offers: false,
};

async function requireCustomer() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You need to be signed in." };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile || profile.role !== "customer" || profile.status !== "active") {
    return { ok: false, error: "You need to be signed in." };
  }
  return { ok: true, user, profile, supabase, admin };
}

export async function loadAccountBundle() {
  const auth = await requireCustomer();
  if (!auth.ok) return { status: "anonymous", user: null, data: emptyData() };

  const { profile, admin } = auth;
  const [wishlistRes, addressesRes, prefsRes, ordersRes] = await Promise.all([
    admin.from("wishlist_items").select("slug").eq("user_id", profile.id).order("created_at", { ascending: false }),
    admin.from("addresses").select("*").eq("user_id", profile.id).order("created_at", { ascending: true }),
    admin.from("notification_prefs").select("*").eq("user_id", profile.id).maybeSingle(),
    admin
      .from("orders")
      .select("*, order_items(*)")
      .eq("customer_id", profile.id)
      .order("placed_at", { ascending: false }),
  ]);

  const prefsRow = prefsRes.data;
  return {
    status: "authenticated",
    user: {
      id: profile.id,
      name: profile.full_name,
      email: profile.email,
      phone: profile.phone || "",
      createdAt: profile.created_at,
    },
    data: {
      wishlist: (wishlistRes.data ?? []).map((row) => row.slug),
      addresses: (addressesRes.data ?? []).map(mapAddress),
      orders: (ordersRes.data ?? []).map((row) => mapOrder(row, row.order_items)),
      prefs: {
        orderEmails: prefsRow?.order_emails ?? DEFAULT_PREFS.orderEmails,
        whatsappUpdates: prefsRow?.whatsapp_updates ?? DEFAULT_PREFS.whatsappUpdates,
        offers: prefsRow?.offers ?? DEFAULT_PREFS.offers,
      },
    },
  };
}

function emptyData() {
  return {
    wishlist: [],
    addresses: [],
    orders: [],
    prefs: { ...DEFAULT_PREFS },
  };
}

export async function storeSignUp({ name, email, phone, password, offers }) {
  const cleanEmail = String(email ?? "").trim().toLowerCase();
  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email: cleanEmail,
    password,
    email_confirm: true,
    user_metadata: {
      full_name: String(name).trim(),
      phone: String(phone ?? "").trim(),
      role: "customer",
      status: "active",
      offers: Boolean(offers),
    },
  });
  if (error) {
    if (/already/i.test(error.message)) {
      return { ok: false, error: "An account with this email already exists. Try signing in instead." };
    }
    return { ok: false, error: error.message };
  }

  await admin
    .from("profiles")
    .update({
      full_name: String(name).trim(),
      phone: String(phone ?? "").trim(),
      role: "customer",
      status: "active",
      email: cleanEmail,
    })
    .eq("id", data.user.id);

  await admin.from("notification_prefs").upsert({
    user_id: data.user.id,
    order_emails: true,
    whatsapp_updates: true,
    offers: Boolean(offers),
  });

  const supabase = await createClient();
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });
  if (signInError) return { ok: false, error: signInError.message };
  return { ok: true };
}

export async function storeSignIn(email, password) {
  const cleanEmail = String(email ?? "").trim().toLowerCase();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });
  if (error) return { ok: false, error: "Incorrect email or password." };

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role, status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (!profile || profile.role !== "customer") {
    await supabase.auth.signOut();
    return { ok: false, error: "Incorrect email or password." };
  }
  if (profile.status !== "active") {
    await supabase.auth.signOut();
    return { ok: false, error: "This account has been disabled." };
  }

  await admin
    .from("profiles")
    .update({ last_login_at: new Date().toISOString() })
    .eq("id", data.user.id);

  return { ok: true };
}

export async function storeSignOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return { ok: true };
}

export async function storeUpdateProfile({ name, email, phone }) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth;

  const cleanEmail = String(email ?? "").trim().toLowerCase();
  const { admin, profile, supabase } = auth;

  const { error: profileError } = await admin
    .from("profiles")
    .update({
      full_name: String(name).trim(),
      phone: String(phone ?? "").trim(),
      email: cleanEmail,
    })
    .eq("id", profile.id);
  if (profileError) {
    if (/unique|duplicate/i.test(profileError.message)) {
      return { ok: false, error: "That email is already used by another account." };
    }
    return { ok: false, error: profileError.message };
  }

  if (cleanEmail !== profile.email) {
    await admin.auth.admin.updateUserById(profile.id, { email: cleanEmail });
  }

  revalidatePath("/account");
  return { ok: true };
}

export async function storeChangePassword(currentPassword, newPassword) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth;

  const { supabase, profile } = auth;
  const { error: checkError } = await supabase.auth.signInWithPassword({
    email: profile.email,
    password: currentPassword,
  });
  if (checkError) return { ok: false, error: "Your current password is incorrect." };

  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function storeDeleteAccount() {
  const auth = await requireCustomer();
  if (!auth.ok) return auth;
  const { admin, profile, supabase } = auth;
  await supabase.auth.signOut();
  await admin.auth.admin.deleteUser(profile.id);
  return { ok: true };
}

export async function storeToggleWishlist(slug) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth;
  const { admin, profile } = auth;
  const clean = String(slug);

  const { data: existing } = await admin
    .from("wishlist_items")
    .select("slug")
    .eq("user_id", profile.id)
    .eq("slug", clean)
    .maybeSingle();

  if (existing) {
    await admin.from("wishlist_items").delete().eq("user_id", profile.id).eq("slug", clean);
  } else {
    await admin.from("wishlist_items").insert({ user_id: profile.id, slug: clean });
  }
  revalidatePath("/account/wishlist");
  return { ok: true };
}

export async function storeSaveAddress(address) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth;
  const { admin, profile } = auth;

  const { data: current } = await admin.from("addresses").select("*").eq("user_id", profile.id);
  const list = current ?? [];
  const id = address.id || undefined;
  const makeDefault = address.isDefault || list.length === 0;

  if (makeDefault) {
    await admin.from("addresses").update({ is_default: false }).eq("user_id", profile.id);
  }

  const row = {
    user_id: profile.id,
    label: address.label || "Home",
    name: address.name || "",
    phone: address.phone || "",
    line1: address.line1 || address.line || "",
    line2: address.line2 || "",
    city: address.city || address.area || "",
    emirate: address.emirate || "",
    is_default: makeDefault,
  };

  if (id) {
    await admin.from("addresses").update(row).eq("id", id).eq("user_id", profile.id);
  } else {
    await admin.from("addresses").insert(row);
  }
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function storeDeleteAddress(id) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth;
  const { admin, profile } = auth;
  await admin.from("addresses").delete().eq("id", id).eq("user_id", profile.id);

  const { data: remaining } = await admin.from("addresses").select("*").eq("user_id", profile.id);
  if (remaining?.length && !remaining.some((a) => a.is_default)) {
    await admin.from("addresses").update({ is_default: true }).eq("id", remaining[0].id);
  }
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function storeSetDefaultAddress(id) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth;
  const { admin, profile } = auth;
  await admin.from("addresses").update({ is_default: false }).eq("user_id", profile.id);
  await admin.from("addresses").update({ is_default: true }).eq("id", id).eq("user_id", profile.id);
  revalidatePath("/account/addresses");
  return { ok: true };
}

export async function storeSavePrefs(prefs) {
  const auth = await requireCustomer();
  if (!auth.ok) return auth;
  const { admin, profile } = auth;
  await admin.from("notification_prefs").upsert({
    user_id: profile.id,
    order_emails: prefs.orderEmails ?? true,
    whatsapp_updates: prefs.whatsappUpdates ?? true,
    offers: prefs.offers ?? false,
  });
  revalidatePath("/account/settings");
  return { ok: true };
}
