"use client";

import { useState } from "react";
import {
  ALL_PRODUCTS,
  FEATURED_PRODUCTS,
  PRICE_RANGES,
} from "../data/products";
import ProductCard from "./ProductCard";

function productsFor(range) {
  if (range.id === "featured") return FEATURED_PRODUCTS;
  return ALL_PRODUCTS.filter((p) => p.price >= range.min && p.price <= range.max);
}

export default function PriceRangeLaptops() {
  const [activeId, setActiveId] = useState(PRICE_RANGES[0].id);
  const activeRange = PRICE_RANGES.find((r) => r.id === activeId);
  const products = productsFor(activeRange);

  return (
    <section
      aria-labelledby="price-range"
      className="bg-linear-to-b from-brand-50/50 to-brand-50"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
            Find your price range
          </p>
          <h2
            id="price-range"
            className="mt-3 text-3xl font-extrabold tracking-tight text-brand-950 sm:text-4xl"
          >
            Shop laptops from AED 899
          </h2>
          <p className="mt-4 text-sm text-zinc-500">
            Pick a price range and browse matching laptops right here.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Price range"
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {PRICE_RANGES.map((range) => {
            const selected = range.id === activeId;
            return (
              <button
                key={range.id}
                type="button"
                role="tab"
                id={`tab-${range.id}`}
                aria-selected={selected}
                aria-controls="price-range-panel"
                onClick={() => setActiveId(range.id)}
                className={`h-9 rounded-full border px-4 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                  selected
                    ? "border-brand-950 bg-brand-950 text-white"
                    : "border-brand-100 bg-white text-zinc-700 hover:border-brand-500 hover:text-brand-700"
                }`}
              >
                {range.label}
              </button>
            );
          })}
        </div>

        <div
          id="price-range-panel"
          role="tabpanel"
          aria-labelledby={`tab-${activeId}`}
          className="mt-8"
        >
          {products.length > 0 ? (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {products.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-brand-200 bg-white py-12 text-center text-sm text-zinc-500">
              No laptops in this range right now. Check back soon.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
