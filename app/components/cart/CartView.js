"use client";

import Image from "next/image";
import Link from "next/link";
import { clearCart, MAX_QTY, removeFromCart, setQuantity, useCart } from "../../lib/cart";
import { formatPrice } from "../../data/products";
import { primaryButtonClass } from "../forms";
import { ReturnIcon, ShieldCheckIcon, TrashIcon, TruckIcon } from "../Icons";
import QuantityStepper from "./QuantityStepper";

const ASSURANCES = [
  { icon: ShieldCheckIcon, text: "6-month warranty on every laptop" },
  { icon: ReturnIcon, text: "15-day easy returns" },
  { icon: TruckIcon, text: "2–3 working days · COD & Tabby available" },
];

function CartSkeleton() {
  return (
    <div aria-hidden className="grid animate-pulse gap-6 lg:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        <div className="h-40 rounded-3xl bg-zinc-100" />
        <div className="h-40 rounded-3xl bg-zinc-100" />
      </div>
      <div className="h-72 rounded-3xl bg-brand-50" />
    </div>
  );
}

function EmptyCart() {
  return (
    <p className="text-sm text-zinc-600">
      Your cart is empty.{" "}
      <Link
        href="/laptops"
        className="font-bold text-brand-700 underline underline-offset-2 hover:text-brand-900"
      >
        Browse renewed laptops
      </Link>{" "}
      to find your next one.
    </p>
  );
}

function CartLine({ line }) {
  const { product, variant, qty, max, lineTotal } = line;
  const href = `/laptops/${product.slug}`;
  const unitPrice = variant?.price ?? product.price;

  return (
    <li className="flex gap-4 rounded-3xl border border-zinc-200 bg-white p-4 sm:p-5">
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className="relative block h-24 w-28 shrink-0 overflow-hidden rounded-2xl bg-linear-to-b from-brand-50/60 to-white sm:h-28 sm:w-36"
      >
        <Image
          src={product.image}
          alt=""
          fill
          sizes="144px"
          className="object-contain p-2"
        />
      </Link>

      <div className="flex min-w-0 flex-1 flex-col">
        <h3 className="line-clamp-2 text-[13px] font-semibold leading-snug text-zinc-800 sm:text-sm">
          <Link href={href} className="hover:text-brand-700">
            {product.title}
          </Link>
        </h3>
        {variant?.label && (product.variants?.length ?? 0) > 1 && (
          <p className="mt-1 text-[11px] font-semibold text-zinc-600">{variant.label}</p>
        )}
        <p className="mt-1.5 text-[11px] font-semibold text-zinc-500">
          <span className={product.condition === "Excellent" ? "text-brand-700" : "text-amber-600"}>
            {product.condition}
          </span>
          <span className="mx-1.5 text-zinc-300">·</span>
          {product.warranty}
        </p>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-3 pt-4">
          <div className="flex items-center gap-3">
            <QuantityStepper
              value={qty}
              onChange={(next) => setQuantity(product.slug, variant?.id ?? null, next)}
              label={`Quantity for ${product.title}`}
              max={max}
            />
            <button
              type="button"
              onClick={() => removeFromCart(product.slug, variant?.id ?? null)}
              aria-label={`Remove ${product.title} from cart`}
              className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[11px] font-bold text-zinc-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <TrashIcon width={15} height={15} />
              <span className="hidden sm:inline">Remove</span>
            </button>
          </div>
          <div className="text-right">
            <p className="text-base font-extrabold text-brand-950">{formatPrice(lineTotal)}</p>
            {qty > 1 && (
              <p className="text-[11px] text-zinc-500">{formatPrice(unitPrice)} each</p>
            )}
          </div>
        </div>
        {qty >= max && (
          <p className="mt-2 text-[11px] font-medium text-amber-700">
            {max < MAX_QTY
              ? `Only ${max} in stock.`
              : `Maximum of ${MAX_QTY} per order. Contact us for bulk orders.`}
          </p>
        )}
      </div>
    </li>
  );
}

export default function CartView() {
  const { ready, lines, count, subtotal } = useCart();

  if (!ready) return <CartSkeleton />;
  if (lines.length === 0) return <EmptyCart />;

  return (
    <div className="grid items-start gap-6 lg:grid-cols-[1fr_360px]">
      <section aria-label="Items in your cart">
        <ul className="space-y-4">
          {lines.map((line) => (
            <CartLine key={`${line.product.slug}:${line.variant?.id ?? "default"}`} line={line} />
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs font-bold">
          <Link href="/laptops" className="text-brand-700 hover:underline">
            ← Continue shopping
          </Link>
          <button
            type="button"
            onClick={clearCart}
            className="text-zinc-500 transition hover:text-red-600"
          >
            Clear cart
          </button>
        </div>
      </section>

      <aside
        aria-labelledby="order-summary"
        className="rounded-3xl border border-brand-100 bg-white p-6 shadow-sm lg:sticky lg:top-28"
      >
        <h2 id="order-summary" className="text-base font-extrabold text-brand-950">
          Order summary
        </h2>
        <dl className="mt-5 space-y-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-zinc-600">
              Subtotal ({count} {count === 1 ? "item" : "items"})
            </dt>
            <dd className="font-semibold text-zinc-900">{formatPrice(subtotal)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-zinc-600">Delivery</dt>
            <dd className="text-zinc-500">Confirmed at checkout</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-zinc-100 pt-4">
            <dt className="font-extrabold text-brand-950">Total</dt>
            <dd className="text-xl font-extrabold text-brand-950">{formatPrice(subtotal)}</dd>
          </div>
        </dl>

        <Link href="/checkout" className={`${primaryButtonClass} mt-6 w-full`}>
          Proceed to checkout
        </Link>
        <ul className="mt-6 space-y-3 border-t border-zinc-100 pt-5">
          {ASSURANCES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-xs text-zinc-600">
              <Icon width={18} height={18} className="shrink-0 text-brand-600" />
              {text}
            </li>
          ))}
        </ul>
      </aside>
    </div>
  );
}
