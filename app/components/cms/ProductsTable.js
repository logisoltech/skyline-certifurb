"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { deleteProductsAction, setProductsStatusAction } from "../../cms/actions/products";
import { BRAND_NAMES } from "../../lib/cms/constants";
import { DownloadIcon, SearchIcon } from "../Icons";
import { Badge, Notice, btnDanger, btnPrimary, btnSecondary, controlClass, formatAed, formatDate, inputClass } from "./ui";

const PAGE_SIZE = 20;

const SORTS = {
  newest: { label: "Recently updated", fn: (a, b) => b.updatedAt.localeCompare(a.updatedAt) },
  title: { label: "Title A–Z", fn: (a, b) => a.title.localeCompare(b.title) },
  "price-asc": { label: "Price: low to high", fn: (a, b) => a.price - b.price },
  "price-desc": { label: "Price: high to low", fn: (a, b) => b.price - a.price },
  "stock-asc": { label: "Stock: low to high", fn: (a, b) => a.stock - b.stock },
};

function stockBadge(stock, threshold) {
  if (stock === 0) return <Badge tone="red">Out of stock</Badge>;
  if (stock <= threshold) return <Badge tone="amber">{stock} · Low</Badge>;
  return <Badge tone="green">{stock} in stock</Badge>;
}

export default function ProductsTable({ products, canWrite, threshold }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [stock, setStock] = useState("all");
  const [brand, setBrand] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState(() => new Set());
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [message, setMessage] = useState(null);

  const brands = useMemo(() => [...new Set(products.map((p) => p.brand))].sort(), [products]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => {
        const skus = (p.variants ?? []).map((v) => v.sku).join(" ");
        if (q && !`${p.title} ${p.sku} ${skus} ${BRAND_NAMES[p.brand] ?? p.brand}`.toLowerCase().includes(q)) return false;
        if (status !== "all" && p.status !== status) return false;
        if (brand !== "all" && p.brand !== brand) return false;
        if (stock === "out" && p.stock !== 0) return false;
        if (stock === "low" && !(p.stock > 0 && p.stock <= threshold)) return false;
        if (stock === "in" && p.stock === 0) return false;
        return true;
      })
      .sort(SORTS[sort].fn);
  }, [products, query, status, brand, stock, sort, threshold]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Only ever act on rows that still exist (the list may have refreshed).
  const liveIds = new Set(products.map((p) => p.id));
  const selectedIds = [...selected].filter((id) => liveIds.has(id));
  const allOnPageSelected = rows.length > 0 && rows.every((p) => selected.has(p.id));

  function resetPage(setter) {
    return (value) => {
      setter(value);
      setPage(1);
    };
  }

  function toggleRow(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function togglePage() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of rows) {
        if (allOnPageSelected) next.delete(p.id);
        else next.add(p.id);
      }
      return next;
    });
  }

  function run(task, successText) {
    setMessage(null);
    startTransition(async () => {
      const result = await task();
      if (result?.ok) {
        setSelected(new Set());
        setConfirmingDelete(false);
        setMessage({ tone: "success", text: successText(result) });
        router.refresh();
      } else {
        setMessage({ tone: "error", text: result?.error ?? "Something went wrong." });
      }
    });
  }

  return (
    <div className="space-y-4">
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-52 flex-1">
            <SearchIcon width={16} height={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="search"
              value={query}
              onChange={(e) => resetPage(setQuery)(e.target.value)}
              placeholder="Search title, SKU or brand"
              aria-label="Search products"
              className={`${inputClass} pl-9`}
            />
          </div>
          <select aria-label="Status" value={status} onChange={(e) => resetPage(setStatus)(e.target.value)} className={controlClass}>
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
          <select aria-label="Stock" value={stock} onChange={(e) => resetPage(setStock)(e.target.value)} className={controlClass}>
            <option value="all">All stock</option>
            <option value="in">In stock</option>
            <option value="low">Low stock</option>
            <option value="out">Out of stock</option>
          </select>
          <select aria-label="Brand" value={brand} onChange={(e) => resetPage(setBrand)(e.target.value)} className={controlClass}>
            <option value="all">All brands</option>
            {brands.map((b) => (
              <option key={b} value={b}>{BRAND_NAMES[b] ?? b}</option>
            ))}
          </select>
          <select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value)} className={controlClass}>
            {Object.entries(SORTS).map(([id, s]) => (
              <option key={id} value={id}>{s.label}</option>
            ))}
          </select>
          <a href="/cms/export/products" className={btnSecondary} download>
            <DownloadIcon width={15} height={15} />
            Export CSV
          </a>
        </div>
      </div>

      {canWrite && selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 px-4 py-3">
          <p className="text-xs font-bold text-brand-950">{selectedIds.length} selected</p>
          <button type="button" disabled={pending} onClick={() => run(() => setProductsStatusAction(selectedIds, "published"), (r) => `Published ${r.count} product${r.count === 1 ? "" : "s"}.`)} className={btnSecondary}>
            Publish
          </button>
          <button type="button" disabled={pending} onClick={() => run(() => setProductsStatusAction(selectedIds, "draft"), (r) => `Moved ${r.count} product${r.count === 1 ? "" : "s"} to draft.`)} className={btnSecondary}>
            Unpublish
          </button>
          {confirmingDelete ? (
            <span className="flex items-center gap-2">
              <span className="text-xs font-semibold text-red-700">Delete {selectedIds.length} permanently?</span>
              <button type="button" disabled={pending} onClick={() => run(() => deleteProductsAction(selectedIds), (r) => `Deleted ${r.count} product${r.count === 1 ? "" : "s"}.`)} className={btnDanger}>
                Yes, delete
              </button>
              <button type="button" onClick={() => setConfirmingDelete(false)} className={btnSecondary}>Cancel</button>
            </span>
          ) : (
            <button type="button" disabled={pending} onClick={() => setConfirmingDelete(true)} className={btnDanger}>
              Delete
            </button>
          )}
          <button type="button" onClick={() => { setSelected(new Set()); setConfirmingDelete(false); }} className="ml-auto text-xs font-bold text-brand-800 hover:underline">
            Clear selection
          </button>
        </div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
            <tr>
              {canWrite && (
                <th className="w-10 px-4 py-3">
                  <input type="checkbox" checked={allOnPageSelected} onChange={togglePage} aria-label="Select all on this page" className="h-4 w-4 accent-brand-600" />
                </th>
              )}
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((p) => (
              <tr key={p.id} className={selected.has(p.id) ? "bg-brand-50/50" : "hover:bg-zinc-50/60"}>
                {canWrite && (
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleRow(p.id)} aria-label={`Select ${p.title}`} className="h-4 w-4 accent-brand-600" />
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="relative h-11 w-14 shrink-0 overflow-hidden rounded-lg border border-zinc-100 bg-zinc-50">
                      <Image src={p.image} alt="" fill sizes="56px" className="object-contain p-1" />
                    </span>
                    <div className="min-w-0">
                      <Link href={`/cms/products/${p.id}`} className="line-clamp-1 font-semibold text-zinc-900 hover:text-brand-700">
                        {p.title}
                      </Link>
                      <p className="text-[11px] text-zinc-500">
                        {p.sku} · {BRAND_NAMES[p.brand] ?? p.brand}
                        {(p.variants?.length ?? 1) > 1 && (
                          <span className="ml-2">{p.variants.length} options</span>
                        )}
                        {p.featured && <span className="ml-2 font-bold text-brand-700">★ Featured</span>}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 font-semibold text-zinc-800">
                  {p.priceMax && p.priceMax > p.price ? `From ${formatAed(p.price)}` : formatAed(p.price)}
                </td>
                <td className="px-4 py-3">{stockBadge(p.stock, threshold)}</td>
                <td className="px-4 py-3">
                  <Badge tone={p.status === "published" ? "green" : "zinc"}>
                    {p.status === "published" ? "Published" : "Draft"}
                  </Badge>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">{formatDate(p.updatedAt)}</td>
                <td className="whitespace-nowrap px-4 py-3 text-right text-xs font-bold">
                  <Link href={`/cms/products/${p.id}`} className="text-brand-700 hover:underline">
                    {canWrite ? "Edit" : "View"}
                  </Link>
                  {p.status === "published" && (
                    <Link href={`/laptops/${p.slug}`} target="_blank" className="ml-3 text-zinc-500 hover:text-brand-700">
                      Store ↗
                    </Link>
                  )}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={canWrite ? 7 : 6} className="px-4 py-12 text-center text-sm text-zinc-500">
                  {products.length === 0 ? (
                    <>
                      No products yet.{" "}
                      {canWrite && (
                        <Link href="/cms/products/new" className="font-bold text-brand-700 underline">Add your first product</Link>
                      )}
                    </>
                  ) : (
                    "No products match these filters."
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-zinc-500">
        <p>
          {filtered.length} product{filtered.length === 1 ? "" : "s"}
          {filtered.length !== products.length && ` (of ${products.length})`}
        </p>
        {pageCount > 1 && (
          <div className="flex items-center gap-2">
            <button type="button" className={btnSecondary} disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}>
              Previous
            </button>
            <span className="font-semibold text-zinc-700">
              Page {currentPage} of {pageCount}
            </span>
            <button type="button" className={btnPrimary} disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}>
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
