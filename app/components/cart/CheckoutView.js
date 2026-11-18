"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { clearCart, useCart } from "../../lib/cart";
import { formatPrice } from "../../data/products";
import { refreshStoreAccount, useAccount } from "../../lib/auth";
import { createOrderAction } from "../../lib/store/checkout-actions";
import {
  Alert,
  SelectField,
  TextField,
  primaryButtonClass,
  secondaryButtonClass,
} from "../forms";

const PAYMENTS = ["Cash on Delivery", "Card", "Tabby (4 payments)"];

export default function CheckoutView() {
  const router = useRouter();
  const { ready, lines, subtotal } = useCart();
  const { status, user, data } = useAccount();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const defaultAddress = useMemo(
    () => data.addresses.find((a) => a.isDefault) || data.addresses[0] || null,
    [data.addresses],
  );

  if (!ready || status === "loading") {
    return <div className="h-72 animate-pulse rounded-3xl bg-zinc-100" aria-hidden />;
  }

  if (lines.length === 0) {
    return (
      <p className="text-sm text-zinc-600">
        Your cart is empty.{" "}
        <Link href="/laptops" className="font-bold text-brand-700 underline">
          Browse laptops
        </Link>
      </p>
    );
  }

  if (status !== "authenticated") {
    return (
      <div className="rounded-3xl border border-brand-200 bg-white p-6">
        <h2 className="text-lg font-extrabold text-brand-950">Sign in to checkout</h2>
        <p className="mt-2 text-sm text-zinc-600">
          Create an account or sign in so we can save your order and delivery details.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/login?next=/checkout" className={primaryButtonClass}>
            Sign in
          </Link>
          <Link href="/signup?next=/checkout" className={secondaryButtonClass}>
            Create account
          </Link>
        </div>
      </div>
    );
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setBusy(true);
    const form = new FormData(event.currentTarget);
    const address = {
      name: String(form.get("name") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
      emirate: String(form.get("emirate") ?? "").trim(),
      area: String(form.get("area") ?? "").trim(),
      line: String(form.get("line") ?? "").trim(),
    };
    if (!address.name || !address.phone || !address.emirate || !address.line) {
      setBusy(false);
      setError("Fill in your delivery details.");
      return;
    }

    const result = await createOrderAction({
      items: lines.map((line) => ({
        slug: line.product.slug,
        variantId: line.variant?.id ?? null,
        qty: line.qty,
      })),
      payment: String(form.get("payment") ?? PAYMENTS[0]),
      address,
    });

    if (!result.ok) {
      setError(result.error || "Could not place the order.");
      setBusy(false);
      if (result.needsAuth) router.push("/login?next=/checkout");
      return;
    }

    clearCart();
    await refreshStoreAccount();
    router.replace(`/account/orders?placed=${encodeURIComponent(result.orderId)}`);
  }

  return (
    <form onSubmit={handleSubmit} className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <section className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6">
        <h2 className="text-base font-extrabold text-brand-950">Delivery details</h2>
        {error && <Alert>{error}</Alert>}
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="Full name" name="name" required defaultValue={defaultAddress?.name || user?.name || ""} />
          <TextField label="Phone" name="phone" required defaultValue={defaultAddress?.phone || user?.phone || ""} />
          <SelectField label="Emirate" name="emirate" required defaultValue={defaultAddress?.emirate || ""}>
            <option value="">Select emirate</option>
            {["Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Umm Al Quwain", "Ras Al Khaimah", "Fujairah"].map(
              (e) => (
                <option key={e} value={e}>
                  {e}
                </option>
              ),
            )}
          </SelectField>
          <TextField label="Area" name="area" defaultValue={defaultAddress?.area || ""} />
          <TextField
            label="Building, street & apartment"
            name="line"
            required
            className="sm:col-span-2"
            defaultValue={defaultAddress?.line || ""}
          />
          <SelectField label="Payment" name="payment" defaultValue={PAYMENTS[0]} className="sm:col-span-2">
            {PAYMENTS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </SelectField>
        </div>
      </section>

      <aside className="rounded-3xl border border-brand-100 bg-white p-6 shadow-sm lg:sticky lg:top-28">
        <h2 className="text-base font-extrabold text-brand-950">Order summary</h2>
        <ul className="mt-4 space-y-3 text-sm">
          {lines.map((line) => (
            <li key={`${line.product.slug}:${line.variant?.id}`} className="flex justify-between gap-3">
              <span className="text-zinc-600">
                {line.qty}× {line.product.title}
              </span>
              <span className="font-semibold text-zinc-900">{formatPrice(line.lineTotal)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex justify-between border-t border-zinc-100 pt-4 text-base font-extrabold text-brand-950">
          <span>Total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <button type="submit" disabled={busy} className={`${primaryButtonClass} mt-6 w-full`}>
          {busy ? "Placing order…" : "Place order"}
        </button>
      </aside>
    </form>
  );
}
