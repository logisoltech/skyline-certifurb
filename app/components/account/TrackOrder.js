"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAccount } from "../../lib/auth";
import { describeOrder, formatDate, isActiveOrder } from "../../data/orders";
import { formatPrice } from "../../data/products";
import { SearchIcon } from "../Icons";
import { primaryButtonClass } from "../forms";
import {
  EmptyState,
  EstimatedDelivery,
  OrderAddress,
  OrderItems,
  OrderTimeline,
  PageHeading,
  StatusBadge,
} from "./OrderParts";

export default function TrackOrder() {
  const { user, data } = useAccount();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requested = (searchParams.get("order") ?? "").trim();
  const [draft, setDraft] = useState(requested);
  if (!user) return null;

  const orders = [...data.orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  const activeOrders = orders.filter(isActiveOrder);

  // Show the order they asked for; otherwise their latest one still in transit.
  const order = requested
    ? orders.find((o) => o.id.toLowerCase() === requested.toLowerCase())
    : (activeOrders[0] ?? orders[0]);
  const notFound = Boolean(requested) && !order;

  function handleSubmit(event) {
    event.preventDefault();
    const value = draft.trim();
    router.replace(value ? `/account/track?order=${encodeURIComponent(value)}` : "/account/track");
  }

  return (
    <div className="space-y-6">
      <PageHeading
        title="Track your order"
        description="Follow your laptop from our workshop to your door."
      />

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-3 rounded-3xl border border-brand-100 bg-white p-4 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="order-number" className="mb-1.5 block text-xs font-bold text-zinc-800">
            Order number
          </label>
          <input
            id="order-number"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="e.g. CF-10498"
            autoComplete="off"
            className="h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm uppercase outline-none transition placeholder:normal-case placeholder:text-zinc-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15"
          />
        </div>
        <button type="submit" className={`${primaryButtonClass} gap-2`}>
          <SearchIcon width={16} height={16} />
          Track
        </button>
      </form>

      {activeOrders.length > 1 && (
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-zinc-500">In progress:</span>
          {activeOrders.map((o) => (
            <Link
              key={o.id}
              href={`/account/track?order=${o.id}`}
              className={`rounded-full border px-3 py-1.5 font-bold transition ${
                order?.id === o.id
                  ? "border-brand-950 bg-brand-950 text-white"
                  : "border-brand-100 bg-white text-zinc-700 hover:border-brand-500 hover:text-brand-700"
              }`}
            >
              {o.id}
            </Link>
          ))}
        </div>
      )}

      {notFound && (
        <EmptyState
          title={`We couldn't find "${requested}"`}
          text="Check the order number in your confirmation email. It looks like CF-12345. You can only track orders placed with this account."
          action={
            <Link href="/account/orders" className={primaryButtonClass}>
              View my orders
            </Link>
          }
        />
      )}

      {!order && !notFound && (
        <EmptyState
          title="You have no orders to track"
          text="Once you place an order, you can follow it here step by step."
          action={
            <Link href="/laptops" className={primaryButtonClass}>
              Browse renewed laptops
            </Link>
          }
        />
      )}

      {order && (
        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <section
            aria-labelledby="tracking-status"
            className="rounded-3xl border border-zinc-200 bg-white p-6"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="tracking-status" className="text-lg font-extrabold text-brand-950">
                  {order.id}
                </h2>
                <p className="mt-1 text-xs font-semibold text-brand-700">
                  <EstimatedDelivery order={order} />
                </p>
              </div>
              <StatusBadge status={order.status} />
            </div>
            <div className="mt-6">
              <OrderTimeline order={order} />
            </div>
          </section>

          <div className="space-y-6">
            <section className="rounded-3xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-extrabold text-brand-950">Items</h2>
              <div className="mt-2">
                <OrderItems order={order} />
              </div>
              <p className="mt-2 flex justify-between border-t border-zinc-100 pt-3 text-sm font-extrabold text-brand-950">
                <span>Total</span>
                <span>{formatPrice(describeOrder(order).total)}</span>
              </p>
            </section>

            <section className="rounded-3xl border border-zinc-200 bg-white p-6">
              <h2 className="text-sm font-extrabold text-brand-950">Delivering to</h2>
              <div className="mt-3">
                <OrderAddress order={order} />
              </div>
              <p className="mt-3 text-[11px] text-zinc-500">
                Placed {formatDate(order.placedAt)} · {order.payment}
              </p>
            </section>

            <p className="rounded-2xl bg-brand-50 px-4 py-3 text-xs leading-relaxed text-brand-900">
              Questions about this order? Call us on{" "}
              <a href="tel:+97165333033" className="font-bold underline">
                +971 6 533 3033
              </a>{" "}
              or message us on WhatsApp.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
