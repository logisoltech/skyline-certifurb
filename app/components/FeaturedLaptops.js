import Link from "next/link";
import { FEATURED_PRODUCTS } from "../data/products";
import { ArrowRightIcon } from "./Icons";
import ProductCard from "./ProductCard";

export default function FeaturedLaptops() {
  return (
    <section
      aria-labelledby="featured-laptops"
      className="bg-linear-to-b from-white to-brand-50/50"
    >
      <div className="mx-auto max-w-7xl px-4 pb-14 pt-6 sm:px-6 sm:pb-16">
        <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
          Popular right now
        </p>
        <h2
          id="featured-laptops"
          className="mt-3 text-3xl font-extrabold tracking-tight text-brand-950 sm:text-4xl"
        >
          Featured renewed laptops
        </h2>

        <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
          <p className="text-sm text-zinc-500">
            In-stock business laptops from AED 899, selected across trusted
            brands.
          </p>
          <Link
            href="/laptops"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-700 transition hover:text-brand-900"
          >
            View all laptops
            <ArrowRightIcon width={14} height={14} />
          </Link>
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURED_PRODUCTS.map((product) => (
            <ProductCard key={product.slug} product={product} />
          ))}
        </ul>
      </div>
    </section>
  );
}
