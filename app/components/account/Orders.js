"use client";

import Link from "next/link";
import { useState } from "react";
import { useAccount } from "../../lib/auth";
import { describeOrder, formatDate, isActiveOrder } from "../../data/orders";
import { formatPrice } from "../../data/products";
import { ChevronDownIcon } from "../Icons";
import { primaryButtonClass } from "../forms";
import {
  EmptyState,
  EstimatedDelivery,
  OrderAddress,
  OrderItems,
  OrderTotals,
  PageHeading,
  StatusBadge,
} from "./OrderParts";

const FILTERS = [
  { id: "all", label: "All", test: () => true },
  { id: "active", label: "In progress", test: isActiveOrder },
  { id: "delivered", label: "Delivered", test: (o) => o.status === "delivered" },
  { id: "cancelled", label: "Cancelled", test: (o) => o.status === "cancelled" },
];

function OrderCard({ order }) {
  const { total } = describeOrder(order);
  const canTrack = order.status !== "cancelled";

  return (
    <li>
      <article className="rounded-3xl border border-zinc-200 bg-white p-5 sm:p-6">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-extrabold text-brand-950">{order.id}</h2>
            <p className="mt-1 text-[11px] text-zinc-500">
              Placed {formatDate(order.placedAt)}
              {" · "}
              <span className="font-semibold text-zinc-700">
                <EstimatedDelivery order={order} />
              </span>
            </p>
          </div>
          <StatusBadge status={order.status} />
        </header>

        <div className="mt-3">
          <OrderItems order={order} />
        </div>

        <footer className="mt-2 flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 pt-4">
          <p className="text-xs text-zinc-500">
            Total{" "}
            <span className="text-base font-extrabold text-brand-950">
              {formatPrice(total)}
            </span>
          </p>
          {canTrack && (
            <Link
              href={`/account/track?order=${order.id}`}
              className={`${primaryButtonClass} h-9`}
            >
              Track order
            </Link>
          )}
        </footer>

        <details className="group mt-4 rounded-2xl bg-brand-50/60">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 rounded-2xl px-4 py-3 text-xs font-bold text-brand-900 focus-visible:outline-2 focus-visible:outline-brand-600 [&::-webkit-details-marker]:hidden">
            Order details
            <ChevronDownIcon
              width={15}
              height={15}
              className="transition group-open:rotate-180"
            />
          </summary>
          <div className="grid gap-6 px-4 pb-5 pt-1 sm:grid-cols-3">
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                Delivery address
              </h3>
              <OrderAddress order={order} />
            </div>
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                Payment
              </h3>
              <p className="text-xs text-zinc-600">{order.payment}</p>
            </div>
            <div>
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wide text-zinc-400">
                Summary
              </h3>
              <OrderTotals order={order} />
            </div>
          </div>
        </details>
      </article>
    </li>
  );
}

export default function Orders() {
  const { user, data } = useAccount();
  const [filterId, setFilterId] = useState("all");
  if (!user) return null;

  const orders = [...data.orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  const filter = FILTERS.find((f) => f.id === filterId);
  const shown = orders.filter(filter.test);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Order history"
        description="Everything you've ordered from Certifurb."
      />

      {orders.length === 0 ? (
        <EmptyState
          title="No orders yet"
          text="Once you place an order it will appear here, with live tracking from inspection to delivery."
          action={
            <Link href="/laptops" className={primaryButtonClass}>
              Browse renewed laptops
            </Link>
          }
        />
      ) : (
        <>
          <div role="tablist" aria-label="Filter orders" className="flex flex-wrap gap-2">
            {FILTERS.map((f) => {
              const selected = f.id === filterId;
              const count = orders.filter(f.test).length;
              return (
                <button
                  key={f.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setFilterId(f.id)}
                  className={`h-9 rounded-full border px-4 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                    selected
                      ? "border-brand-950 bg-brand-950 text-white"
                      : "border-brand-100 bg-white text-zinc-700 hover:border-brand-500 hover:text-brand-700"
                  }`}
                >
                  {f.label} ({count})
                </button>
              );
            })}
          </div>

          {shown.length > 0 ? (
            <ul className="space-y-4">
              {shown.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </ul>
          ) : (
            <EmptyState
              title={`No ${filter.label.toLowerCase()} orders`}
              text="Try a different filter to see the rest of your orders."
            />
          )}
        </>
      )}
    </div>
  );
}
