"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { formatAed, formatDate, inputClass } from "./ui";

export default function CustomersTable({ customers, orders }) {
  const [query, setQuery] = useState("");

  const stats = useMemo(() => {
    const map = new Map();
    for (const order of orders) {
      if (order.status === "cancelled") continue;
      const current = map.get(order.customerId) ?? { count: 0, spend: 0 };
      current.count += 1;
      current.spend += order.total;
      map.set(order.customerId, current);
    }
    return map;
  }, [orders]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...customers]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((c) => {
        if (!q) return true;
        return `${c.name} ${c.email} ${c.phone} ${c.emirate}`.toLowerCase().includes(q);
      });
  }, [customers, query]);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-zinc-200 bg-white p-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, phone or emirate"
          aria-label="Search customers"
          className={`${inputClass} max-w-md`}
        />
      </div>

      <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-100 bg-zinc-50 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Emirate</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Spend</th>
              <th className="px-4 py-3">Joined</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {rows.map((c) => {
              const s = stats.get(c.id) ?? { count: 0, spend: 0 };
              return (
                <tr key={c.id} className="hover:bg-zinc-50/60">
                  <td className="px-4 py-3">
                    <Link href={`/cms/customers/${c.id}`} className="font-semibold text-zinc-900 hover:text-brand-700">
                      {c.name}
                    </Link>
                    <p className="text-[11px] text-zinc-500">{c.email}</p>
                  </td>
                  <td className="px-4 py-3 text-zinc-600">{c.emirate}</td>
                  <td className="px-4 py-3">{s.count}</td>
                  <td className="whitespace-nowrap px-4 py-3 font-semibold">{formatAed(s.spend)}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-zinc-500">{formatDate(c.createdAt)}</td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-sm text-zinc-500">
                  {customers.length === 0 ? "No customers yet." : "No customers match this search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
