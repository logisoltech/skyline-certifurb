"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { addToCart, MAX_QTY } from "../../lib/cart";
import { primaryButtonClass, secondaryButtonClass } from "../forms";
import { CheckIcon, CartIcon } from "../Icons";
import WishlistButton from "../WishlistButton";
import QuantityStepper from "./QuantityStepper";

export default function AddToCart({ product, variant }) {
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(0);

  const selected = variant ?? product.variants?.[0] ?? null;
  const inStock = selected ? selected.inStock !== false && (selected.stock ?? 1) > 0 : product.inStock !== false;
  const stock = selected?.stock ?? product.stock;

  useEffect(() => {
    setQty(1);
    setAdded(0);
  }, [selected?.id]);

  useEffect(() => {
    if (!added) return;
    const timer = setTimeout(() => setAdded(0), 6000);
    return () => clearTimeout(timer);
  }, [added]);

  if (!inStock) {
    return (
      <div>
        <p className="text-sm font-bold text-zinc-700">Currently out of stock</p>
        <p className="mt-1 text-xs text-zinc-500">
          Renewed stock sells fast. Message us on WhatsApp and we'll let you know
          if a similar unit comes in.
        </p>
        <div className="mt-3 flex flex-wrap gap-3">
          <a href="https://wa.me/971566895605" className={secondaryButtonClass}>
            Ask on WhatsApp
          </a>
          <Link href="/laptops" className={secondaryButtonClass}>
            See similar laptops
          </Link>
        </div>
      </div>
    );
  }

  function handleAdd() {
    if (addToCart(product.slug, selected?.id ?? null, qty)) setAdded(qty);
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-3">
        <QuantityStepper
          value={qty}
          onChange={setQty}
          label="Quantity"
          max={Math.min(MAX_QTY, stock ?? MAX_QTY)}
        />
        <button
          type="button"
          onClick={handleAdd}
          className={`${primaryButtonClass} h-12 flex-1 gap-2 sm:flex-none sm:px-10`}
        >
          <CartIcon width={18} height={18} />
          Add to cart
        </button>
        <WishlistButton slug={product.slug} title={product.title} className="h-12 w-12" />
      </div>

      <div aria-live="polite" className="mt-3 min-h-6">
        {added > 0 && (
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs font-semibold text-brand-700">
            <span className="flex items-center gap-1.5">
              <CheckIcon width={16} height={16} />
              {added} {added === 1 ? "item" : "items"} added to your cart.
            </span>
            <Link href="/cart" className="font-bold underline">
              View cart
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
