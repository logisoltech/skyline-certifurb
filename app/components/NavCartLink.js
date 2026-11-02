"use client";

import Link from "next/link";
import { useCart } from "../lib/cart";
import { CartIcon } from "./Icons";

export default function NavCartLink() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      className="group flex items-center gap-2 text-zinc-800"
      aria-label={`Cart, ${count} ${count === 1 ? "item" : "items"}`}
    >
      <span className="relative">
        <CartIcon width={26} height={26} className="transition group-hover:text-brand-700" />
        <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white sm:hidden">
          {count}
        </span>
      </span>
      <span className="hidden items-center gap-1.5 text-xs font-semibold group-hover:text-brand-700 sm:flex">
        <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] text-white">
          {count}
        </span>
        Cart
      </span>
    </Link>
  );
}
