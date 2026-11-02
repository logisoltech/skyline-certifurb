"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { setLowStockThresholdAction, setStockAction } from "../../cms/actions/inventory";
import { BRAND_NAMES } from "../../lib/cms/constants";
import { flattenInventory } from "../../lib/cms/product-model";
import { Badge, Card, Notice, btnSecondary, controlClass, formatAed, inputClass } from "./ui";

function StockEditor({ row, canWrite, onSaved }) {
  const [value, setValue] = useState(String(row.stock));
  const [pending, start] = useTransition();
  const [error, setError] = useState(null);

  useEffect(() => setValue(String(row.stock)), [row.stock]);

  function save() {
    const next = Number(value);
    if (next === row.stock) return;
    setError(null);
    start(async () => {
      const result = await setStockAction(row.productId, row.variantId, next);
      if (result.ok) onSaved();
      else setError(result.error);
    });
  }

  if (!canWrite) return <span className="font-semibold">{row.stock}</span>;

  return (
    <span className="inline-flex flex-col">
      <input
        type="number"
        min="0"
        max="10000"
        value={value}
        disabled={pending}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && save()}
        aria-label={`Stock for ${row.title} ${row.label}`}
        className={`${inputClass} h-9 w-20`}
      />
      {error && <span className="mt-1 text-[10px] font-medium text-red-600">{error}</span>}
    </span>
  );
}

export default function InventoryTable({ products, threshold, canWrite }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [thresholdDraft, setThresholdDraft] = useState(String(threshold));
  const [pending, start] = useTransition();
  const [message, setMessage] = useState(null);

  useEffect(() => setThresholdDraft(String(threshold)), [threshold]);

  const allRows = useMemo(() => flattenInventory(products), [products]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allRows
      .filter((row) => {
        if (q && !`${row.title} ${row.sku} ${row.label}`.toLowerCase().includes(q)) return false;
        if (filter === "out" && row.stock !== 0) return false;
        if (filter === "low" && !(row.stock > 0 && row.stock <= threshold)) return false;
        if (filter === "in" && row.stock === 0) return false;
        return true;
      })
      .sort((a, b) => a.stock - b.stock || a.title.localeCompare(b.title));
  }, [allRows, query, filter, threshold]);

  const out = allRows.filter((p) => p.stock === 0).length;
  const low = allRows.filter((p) => p.stock > 0 && p.stock <= threshold).length;
  const units = allRows.reduce((sum, p) => sum + p.stock, 0);

  function saveThreshold(event) {
    event.preventDefault();
    start(async () => {
      const result = await setLowStockThresholdAction(Number(thresholdDraft));
      if (result.ok) {
        setMessage({ tone: "success", text: `Low-stock level set to ${result.threshold}.` });
        router.refresh();
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  }

  return (
    <div className="space-y-4">
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card title="Units on hand"><p className="text-2xl font-extrabold">{units}</p></Card>
        <Card title="Low stock"><p className="text-2xl font-extrabold text-amber-600">{low}</p></Card>
        <Card title="Out of stock"><p className="text-2xl font-extrabold text-red-600">{out}</p></Card>
      </div>

      {canWrite && (
        <form onSubmit={saveThreshold} className="flex flex-wrap items-end gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
          <label className="text-xs font-bold text-zinc-800">
            Flag as low stock at or below
            <input
              type="number"
              min="0"
              max="1000"
              value={thresholdDraft}
              onChange={(e) => setThresholdDraft(e.target.value)}
              className={`${inputClass} mt-1.5 w-28`}
            />
          </label>
          <button type="submit" disabled={pending} className={btnSecondary}>
            {pending ? "Saving…" : "Save"}
          </button>
        </form>
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search title, SKU or option"
          aria-label="Search inventory"
          className={`${inputClass} max-w-sm`}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Stock filter" className={controlClass}>
          <option value="all">All</option>
          <option value="in">In stock</option>
          <option value="low">Low stock</option>
          <option value="out">Out of stock</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Option</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((row) => (
              <tr key={row.key} className="hover:bg-zinc-50/60">
                <td className="px-4 py-3">
                  <Link href={`/cms/products/${row.productId}`} className="line-clamp-1 font-semibold text-zinc-900 hover:text-brand-700">
                    {row.title}
                  </Link>
                  <p className="text-[11px] text-zinc-500">
                    {row.sku} · {BRAND_NAMES[row.brand] ?? row.brand}
                  </p>
                </td>
                <td className="px-4 py-3 text-xs text-zinc-600">{row.label}</td>
                <td className="whitespace-nowrap px-4 py-3">{formatAed(row.price)}</td>
                <td className="px-4 py-3">
                  <StockEditor row={row} canWrite={canWrite} onSaved={() => router.refresh()} />
                </td>
                <td className="px-4 py-3">
                  {row.stock === 0 ? (
                    <Badge tone="red">Out of stock</Badge>
                  ) : row.stock <= threshold ? (
                    <Badge tone="amber">Low</Badge>
                  ) : (
                    <Badge tone="green">In stock</Badge>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-xs font-bold">
                  <Link href={`/cms/products/${row.productId}`} className="text-brand-700 hover:underline">
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-500">
                  No options match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {canWrite && (
        <p className="text-[11px] text-zinc-500">
          Each row is one option (RAM, storage, and so on). Change a stock number and press Enter or click away to save.
        </p>
      )}
    </div>
  );
}
