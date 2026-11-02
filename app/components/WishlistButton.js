"use client";

import { useRouter } from "next/navigation";
import { toggleWishlist, useAccount } from "../lib/auth";
import { HeartIcon } from "./Icons";

// Heart toggle for product cards. Anonymous visitors are sent to log in
// and brought back to the page they were on.
export default function WishlistButton({ slug, title, className = "" }) {
  const { status, data } = useAccount();
  const router = useRouter();
  const saved = status === "authenticated" && data.wishlist.includes(slug);

  function handleClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (status === "loading") return;
    if (status === "anonymous") {
      // Read the location at click time, so cards don't need a Suspense
      // boundary for useSearchParams.
      const here = window.location.pathname + window.location.search;
      router.push(`/login?next=${encodeURIComponent(here)}`);
      return;
    }
    toggleWishlist(slug);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${title} from wishlist` : `Save ${title} to wishlist`}
      className={`flex h-9 w-9 items-center justify-center rounded-full border bg-white/90 shadow-sm backdrop-blur transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
        saved
          ? "border-red-200 text-red-500"
          : "border-zinc-200 text-zinc-500 hover:border-red-200 hover:text-red-500"
      } ${className}`}
    >
      <HeartIcon width={18} height={18} fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
