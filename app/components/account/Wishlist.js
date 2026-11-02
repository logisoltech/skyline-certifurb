"use client";

import Link from "next/link";
import { useAccount } from "../../lib/auth";
import { useCatalog } from "../CatalogProvider";
import { primaryButtonClass } from "../forms";
import ProductCard from "../ProductCard";
import { EmptyState, PageHeading } from "./OrderParts";

export default function Wishlist() {
  const { user, data } = useAccount();
  const catalog = useCatalog();
  if (!user) return null;

  // Keep the order they saved things in (newest first). Products removed or
  // unpublished in the CMS quietly drop out.
  const products = data.wishlist
    .map((slug) => catalog.find((p) => p.slug === slug))
    .filter(Boolean);

  return (
    <div className="space-y-6">
      <PageHeading
        title="Your wishlist"
        description={
          products.length > 0
            ? `${products.length} saved ${products.length === 1 ? "laptop" : "laptops"}. Tap the heart to remove one.`
            : "Save laptops you like and come back to them anytime."
        }
      />

      {products.length > 0 ? (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </ul>
      ) : (
        <EmptyState
          title="Your wishlist is empty"
          text="Tap the heart on any laptop to save it here."
          action={
            <Link href="/laptops" className={primaryButtonClass}>
              Browse renewed laptops
            </Link>
          }
        />
      )}
    </div>
  );
}
