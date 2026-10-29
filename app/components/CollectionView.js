"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  EMPTY_FILTERS,
  SORT_OPTIONS,
  countActiveFilters,
  getScopeProducts,
  matches,
  scopeTitle,
  sortProducts,
} from "../lib/collection";
import CollectionFilters from "./CollectionFilters";
import { ChevronDownIcon, ChevronRightIcon } from "./Icons";
import ProductCard from "./ProductCard";

export default function CollectionView({ scope }) {
  const title = scopeTitle(scope);
  const scopeProducts = useMemo(() => getScopeProducts(scope), [scope]);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [sort, setSort] = useState("best");
  const [showFilters, setShowFilters] = useState(false);

  const activeCount = countActiveFilters(filters);
  // Nothing in this brand/use/price at all (e.g. a brand we don't stock yet).
  const emptyScope = scopeProducts.length === 0;

  const visible = useMemo(
    () =>
      sortProducts(
        scopeProducts.filter((p) => matches(p, filters)),
        sort,
      ),
    [scopeProducts, filters, sort],
  );

  function toggle(facet, value) {
    setFilters((f) => ({
      ...f,
      [facet]: f[facet].includes(value)
        ? f[facet].filter((v) => v !== value)
        : [...f[facet], value],
    }));
  }

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-[11px] text-zinc-500">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="transition hover:text-brand-700">
              Home
            </Link>
          </li>
          <li aria-hidden>
            <ChevronRightIcon width={11} height={11} />
          </li>
          <li aria-current="page" className="font-semibold text-zinc-700">
            {title}
          </li>
        </ol>
      </nav>

      <div
        className={`mt-4 grid gap-6 ${emptyScope ? "" : "lg:grid-cols-[240px_1fr]"}`}
      >
        {/* Sidebar */}
        <aside aria-label="Filters" hidden={emptyScope}>
          <button
            type="button"
            onClick={() => setShowFilters((s) => !s)}
            aria-expanded={showFilters}
            aria-controls="collection-filters"
            className="flex h-11 w-full items-center justify-between rounded-2xl border border-zinc-200 bg-white px-4 text-xs font-bold text-brand-950 lg:hidden"
          >
            <span>Filters{activeCount > 0 ? ` (${activeCount})` : ""}</span>
            <ChevronDownIcon
              width={16}
              height={16}
              className={`transition ${showFilters ? "rotate-180" : ""}`}
            />
          </button>

          <div
            id="collection-filters"
            className={`${showFilters ? "mt-3 block" : "hidden"} lg:mt-0 lg:block`}
          >
            <CollectionFilters
              products={scopeProducts}
              filters={filters}
              activeCount={activeCount}
              onToggle={toggle}
              onApplyPrice={(price) => setFilters((f) => ({ ...f, price }))}
              onClear={() => setFilters(EMPTY_FILTERS)}
            />
          </div>
        </aside>

        {/* Main column */}
        <div className="min-w-0">
          <header className="rounded-3xl bg-linear-to-br from-brand-50 via-brand-100/70 to-brand-50 px-6 py-8 sm:px-9 sm:py-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-brand-950 sm:text-4xl">
              {title}
            </h1>
            <p className="mt-3 text-xs text-zinc-600">
              6-month warranty · 15-day easy returns
            </p>
          </header>

          {!emptyScope && (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3">
              <div className="flex items-center gap-3">
                <label
                  htmlFor="collection-sort"
                  className="text-[11px] font-bold uppercase tracking-wide text-zinc-700"
                >
                  Sort by
                </label>
                <div className="relative">
                  <select
                    id="collection-sort"
                    value={sort}
                    onChange={(e) => setSort(e.target.value)}
                    className="h-9 cursor-pointer appearance-none rounded-full border border-zinc-300 bg-white py-0 pl-4 pr-9 text-xs font-medium text-zinc-800 outline-none transition hover:border-brand-500 focus:border-brand-600"
                  >
                    {SORT_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDownIcon
                    width={14}
                    height={14}
                    className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  />
                </div>
              </div>
              <p role="status" className="text-xs text-zinc-500">
                {visible.length} {visible.length === 1 ? "laptop" : "laptops"}
              </p>
            </div>
          )}

          {visible.length > 0 ? (
            <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {visible.map((product) => (
                <ProductCard key={product.slug} product={product} />
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-3xl border border-dashed border-brand-200 bg-brand-50/50 px-6 py-16 text-center">
              <p className="text-sm font-bold text-brand-950">
                {emptyScope
                  ? "We don't have any laptops listed here right now."
                  : "No laptops match these filters."}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                {emptyScope
                  ? "New stock arrives often. Browse everything we have, or call us and we'll help you find one."
                  : "Try removing a filter, or browse everything we have in stock."}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                {activeCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setFilters(EMPTY_FILTERS)}
                    className="h-10 rounded-full bg-brand-950 px-6 text-xs font-bold text-white transition hover:bg-brand-700"
                  >
                    Clear filters
                  </button>
                )}
                <Link
                  href="/laptops"
                  className="inline-flex h-10 items-center rounded-full border border-brand-200 bg-white px-6 text-xs font-bold text-brand-950 transition hover:border-brand-600 hover:text-brand-700"
                >
                  View all laptops
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
