"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ORDER_STATUSES } from "../../lib/cms/constants";
import { Badge, controlClass, formatAed, formatDate, inputClass, orderTone } from "./ui";

export default function OrdersTable({ orders, customers }) {
  const names = useMemo(() => new Map(customers.map((c) => [c.id, c])), [customers]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...orders]
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
      .filter((o) => {
        if (status !== "all" && o.status !== status) return false;
        if (!q) return true;
        const customer = names.get(o.customerId);
        return (
          o.id.toLowerCase().includes(q) ||
          (customer?.name ?? "").toLowerCase().includes(q) ||
          (customer?.email ?? "").toLowerCase().includes(q)
        );
      });
  }, [orders, names, query, status]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-200 bg-white p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search order number or customer"
          aria-label="Search orders"
          className={`${inputClass} max-w-sm`}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status" className={controlClass}>
          <option value="all">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right"> </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((o) => {
              const customer = names.get(o.customerId);
              const qty = o.items.reduce((sum, i) => sum + i.qty, 0);
              return (
                <tr key={o.id} className="hover:bg-zinc-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/cms/orders/${o.id}`} className="font-bold text-zinc-900 hover:text-brand-700">
                      {o.id}
                    </Link>
                    <p className="text-[11px] text-zinc-500">{formatDate(o.placedAt)}</p>
                  </td>
                  <td className="px-4 py-3">
                    {customer ? (
                      <Link href={`/cms/customers/${customer.id}`} className="font-semibold hover:text-brand-700">
                        {customer.name}
                      </Link>
                    ) : (
                      "—"
                    )}
                    <p className="text-[11px] text-zinc-500">{o.emirate}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">
                    {qty} item{qty === 1 ? "" : "s"}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatAed(o.total)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={orderTone[o.status]}>
                      {ORDER_STATUSES.find((s) => s.id === o.status)?.label ?? o.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-xs font-bold">
                    <Link href={`/cms/orders/${o.id}`} className="text-brand-700 hover:underline">
                      View
                    </Link>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm text-zinc-500">
                  {orders.length === 0 ? "No orders yet." : "No orders match these filters."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
