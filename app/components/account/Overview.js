"use client";

import Link from "next/link";
import { useAccount } from "../../lib/auth";
import {
  ORDER_STEPS,
  describeOrder,
  formatDate,
  isActiveOrder,
} from "../../data/orders";
import { formatPrice } from "../../data/products";
import { ArrowRightIcon, BoxIcon, HeartIcon, MapPinIcon } from "./../Icons";
import { primaryButtonClass, secondaryButtonClass } from "../forms";
import { EstimatedDelivery, PageHeading, StatusBadge } from "./OrderParts";

function StatCard({ href, icon: Icon, value, label }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-4 rounded-2xl border border-brand-100 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_14px_34px_-16px_rgba(22,101,52,0.4)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
    >
      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
        <Icon width={20} height={20} />
      </span>
      <div>
        <p className="text-2xl font-extrabold leading-none text-brand-950">{value}</p>
        <p className="mt-1.5 text-xs text-zinc-500">{label}</p>
      </div>
    </Link>
  );
}

function Detail({ label, children }) {
  return (
    <div>
      <dt className="text-[11px] font-bold uppercase tracking-wide text-zinc-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm font-medium text-zinc-800">
        {children}
      </dd>
    </div>
  );
}

export default function Overview() {
  const { user, data } = useAccount();
  if (!user) return null;

  const orders = [...data.orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  const active = orders.find(isActiveOrder);
  const recent = orders.slice(0, 3);
  const firstName = user.name.split(" ")[0];
  const defaultAddress = data.addresses.find((a) => a.isDefault);

  const stepIndex = active
    ? Math.max(ORDER_STEPS.findIndex((s) => s.id === active.status), 0)
    : 0;
  const progress = active ? ((stepIndex + 1) / ORDER_STEPS.length) * 100 : 0;

  return (
    <div className="space-y-6">
      <PageHeading
        title={`Welcome back, ${firstName}`}
        description="Here's what's happening with your account."
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard href="/account/orders" icon={BoxIcon} value={orders.length} label="Orders placed" />
        <StatCard href="/account/wishlist" icon={HeartIcon} value={data.wishlist.length} label="Saved laptops" />
        <StatCard href="/account/addresses" icon={MapPinIcon} value={data.addresses.length} label="Saved addresses" />
      </div>

      {active ? (
        <section
          aria-labelledby="active-order"
          className="rounded-3xl border border-brand-100 bg-linear-to-br from-brand-50 to-white p-6"
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
                Order in progress
              </p>
              <h2 id="active-order" className="mt-1.5 text-lg font-extrabold text-brand-950">
                {active.id}
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Placed {formatDate(active.placedAt)} ·{" "}
                {formatPrice(describeOrder(active).total)}
              </p>
            </div>
            <StatusBadge status={active.status} />
          </div>

          <div
            className="mt-5 h-2 overflow-hidden rounded-full bg-brand-100"
            role="progressbar"
            aria-label="Order progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress)}
          >
            <div className="h-full rounded-full bg-brand-600 transition-all" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-xs font-semibold text-brand-800">
            <EstimatedDelivery order={active} />
          </p>

          <Link
            href={`/account/track?order=${active.id}`}
            className={`${primaryButtonClass} mt-5 h-10`}
          >
            Track this order
          </Link>
        </section>
      ) : (
        <section className="rounded-3xl border border-brand-100 bg-linear-to-br from-brand-50 to-white p-6">
          <h2 className="text-lg font-extrabold text-brand-950">
            No orders on the way
          </h2>
          <p className="mt-1.5 max-w-md text-xs leading-relaxed text-zinc-500">
            When you place an order, you'll be able to follow it here from
            inspection to delivery.
          </p>
          <Link href="/laptops" className={`${primaryButtonClass} mt-5 h-10`}>
            Browse renewed laptops
          </Link>
        </section>
      )}

      <div className="grid gap-6 xl:grid-cols-2">
        <section
          aria-labelledby="profile-details"
          className="rounded-3xl border border-zinc-200 bg-white p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="profile-details" className="text-sm font-extrabold text-brand-950">
              Profile details
            </h2>
            <Link
              href="/account/settings"
              className="text-[11px] font-bold text-brand-700 hover:underline"
            >
              Edit
            </Link>
          </div>
          <dl className="mt-5 grid gap-5 sm:grid-cols-2">
            <Detail label="Full name">{user.name}</Detail>
            <Detail label="Email">{user.email}</Detail>
            <Detail label="Phone">{user.phone || "Not added yet"}</Detail>
            <Detail label="Member since">{formatDate(user.createdAt)}</Detail>
            <div className="sm:col-span-2">
              <Detail label="Default delivery address">
                {defaultAddress
                  ? `${defaultAddress.line}, ${defaultAddress.area}, ${defaultAddress.emirate}`
                  : "No address saved yet"}
              </Detail>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="recent-orders"
          className="rounded-3xl border border-zinc-200 bg-white p-6"
        >
          <div className="flex items-center justify-between gap-3">
            <h2 id="recent-orders" className="text-sm font-extrabold text-brand-950">
              Recent orders
            </h2>
            {orders.length > 0 && (
              <Link
                href="/account/orders"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-brand-700 hover:underline"
              >
                View all <ArrowRightIcon width={12} height={12} />
              </Link>
            )}
          </div>
          {recent.length > 0 ? (
            <ul className="mt-4 divide-y divide-zinc-100">
              {recent.map((order) => (
                <li key={order.id} className="flex flex-wrap items-center justify-between gap-2 py-3">
                  <div>
                    <p className="text-[13px] font-bold text-zinc-800">{order.id}</p>
                    <p className="text-[11px] text-zinc-500">
                      {formatDate(order.placedAt)} · {formatPrice(describeOrder(order).total)}
                    </p>
                  </div>
                  <StatusBadge status={order.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-4 text-xs text-zinc-500">
              You haven't placed any orders yet.
            </p>
          )}
        </section>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link href="/account/settings" className={secondaryButtonClass}>
          Update my details
        </Link>
        <Link href="/laptops" className={secondaryButtonClass}>
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
