import Link from "next/link";
import {
  Badge,
  Card,
  Notice,
  PageHeader,
  StatCard,
  btnSecondary,
  formatAed,
  formatDate,
  formatDateTime,
  orderTone,
} from "../../components/cms/ui";
import { requireUser } from "../../lib/cms/auth";
import { BRAND_NAMES, ORDER_STATUSES } from "../../lib/cms/constants";
import { readStore } from "../../lib/cms/db";

export const metadata = { title: "Dashboard" };

const OPEN_STATUSES = ["placed", "preparing", "dispatched"];

function Bars({ rows, tone = "bg-brand-500" }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="space-y-3">
      {rows.map((row) => (
        <li key={row.label}>
          <div className="mb-1 flex justify-between text-xs">
            <span className="font-semibold text-zinc-700">{row.label}</span>
            <span className="text-zinc-500">{row.display ?? row.value}</span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-zinc-100">
            <div
              className={`h-full rounded-full ${row.tone ?? tone}`}
              style={{ width: `${(row.value / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

export default async function DashboardPage({ searchParams }) {
  const [user, store, query] = await Promise.all([requireUser(), readStore(), searchParams]);
  const { products, orders, customers, activity, settings } = store;
  const threshold = settings.lowStockThreshold;

  const published = products.filter((p) => p.status === "published").length;
  const out = products.filter((p) => p.stock === 0);
  const low = products.filter((p) => p.stock > 0 && p.stock <= threshold);
  const units = products.reduce((sum, p) => sum + p.stock, 0);
  const stockValue = products.reduce((sum, p) => sum + p.stock * p.price, 0);

  const live = orders.filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((sum, o) => sum + o.total, 0);
  const open = orders.filter((o) => OPEN_STATUSES.includes(o.status)).length;

  const customerName = new Map(customers.map((c) => [c.id, c.name]));
  const recentOrders = [...orders].sort((a, b) => b.placedAt.localeCompare(a.placedAt)).slice(0, 5);

  const statusRows = ORDER_STATUSES.map((s) => ({
    label: s.label,
    value: orders.filter((o) => o.status === s.id).length,
    tone: s.id === "cancelled" ? "bg-red-400" : "bg-brand-500",
  }));

  const brandRows = Object.entries(
    products.reduce((acc, p) => ({ ...acc, [p.brand]: (acc[p.brand] ?? 0) + p.stock }), {}),
  )
    .map(([brand, value]) => ({
      label: BRAND_NAMES[brand] ?? brand,
      value,
      display: `${value} unit${value === 1 ? "" : "s"}`,
    }))
    .sort((a, b) => b.value - a.value);

  const hasSample = orders.some((o) => o.sample) || customers.some((c) => c.sample);

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user.name.split(/\s+/)[0]}`}
        description="Here's what's happening in your store."
      />

      <div className="space-y-6">
        {query?.denied && (
          <Notice tone="warning">Your role doesn't have access to that page.</Notice>
        )}
        {hasSample && (
          <Notice tone="info">
            Orders and customers shown here are <strong>sample data</strong> so the
            dashboard isn't empty. The storefront has no checkout yet, so no real orders
            can arrive.
          </Notice>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Products" value={products.length} hint={`${published} published · ${products.length - published} draft`} />
          <StatCard label="Units in stock" value={units} hint={`Worth ${formatAed(stockValue)}`} />
          <StatCard
            label="Needs attention"
            value={low.length + out.length}
            hint={`${out.length} out of stock · ${low.length} running low`}
            tone={low.length + out.length > 0 ? "amber" : undefined}
          />
          <StatCard label="Open orders" value={open} hint={`${orders.length} orders total`} />
          <StatCard label="Revenue" value={formatAed(revenue)} hint="Excludes cancelled orders" />
          <StatCard label="Customers" value={customers.length} />
          <StatCard label="CMS users" value={store.users.filter((u) => u.status === "active").length} hint={store.users.some((u) => u.status === "pending") ? "Access requests waiting" : undefined} />
          <StatCard label="Low-stock level" value={`≤ ${threshold}`} hint="Change it on the Inventory page" />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card
            title="Stock to look at"
            description="Out of stock or at/below the low-stock level."
            action={<Link href="/cms/inventory" className={btnSecondary}>Open inventory</Link>}
            padded={false}
          >
            {out.length + low.length === 0 ? (
              <p className="p-5 text-sm text-zinc-500">Everything is comfortably in stock.</p>
            ) : (
              <ul className="divide-y divide-zinc-100">
                {[...out, ...low].slice(0, 6).map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <Link href={`/cms/products/${p.id}`} className="min-w-0 text-sm font-semibold text-zinc-800 hover:text-brand-700">
                      <span className="line-clamp-1">{p.title}</span>
                      <span className="text-[11px] font-normal text-zinc-500">{p.sku}</span>
                    </Link>
                    <Badge tone={p.stock === 0 ? "red" : "amber"}>
                      {p.stock === 0 ? "Out of stock" : `${p.stock} left`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card
            title="Recent orders"
            action={<Link href="/cms/orders" className={btnSecondary}>All orders</Link>}
            padded={false}
          >
            <ul className="divide-y divide-zinc-100">
              {recentOrders.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div className="min-w-0">
                    <Link href={`/cms/orders/${o.id}`} className="text-sm font-bold text-zinc-900 hover:text-brand-700">
                      {o.id}
                    </Link>
                    <p className="truncate text-[11px] text-zinc-500">
                      {customerName.get(o.customerId) ?? "Customer"} · {formatDate(o.placedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold text-zinc-800">{formatAed(o.total)}</span>
                    <Badge tone={orderTone[o.status]}>
                      {ORDER_STATUSES.find((s) => s.id === o.status)?.label}
                    </Badge>
                  </div>
                </li>
              ))}
              {recentOrders.length === 0 && <li className="p-5 text-sm text-zinc-500">No orders yet.</li>}
            </ul>
          </Card>

          <Card title="Orders by status">
            <Bars rows={statusRows} />
          </Card>

          <Card title="Stock by brand" description="Units on hand.">
            <Bars rows={brandRows} />
          </Card>
        </div>

        <Card title="Recent activity" description="What your team has been doing." padded={false}>
          {activity.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">Nothing yet. Changes made in the CMS will show up here.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {activity.slice(0, 8).map((a) => (
                <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3 text-sm">
                  <p className="min-w-0 text-zinc-700">
                    <span className="font-bold text-zinc-900">{a.userName}</span> {a.action}
                    {a.detail && <span className="text-zinc-500"> · {a.detail}</span>}
                  </p>
                  <time dateTime={a.at} className="text-[11px] text-zinc-500">
                    {formatDateTime(a.at)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
