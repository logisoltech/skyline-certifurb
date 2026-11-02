import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Badge, Card, PageHeader, formatAed, formatDate, formatDateTime, orderTone } from "../../../../components/cms/ui";
import { requireUser } from "../../../../lib/cms/auth";
import { ORDER_STATUSES } from "../../../../lib/cms/constants";
import { readStore } from "../../../../lib/cms/db";

export const metadata = { title: "Customer" };

export default function CustomerPage({ params }) {
  return (
    <Suspense fallback={<div aria-hidden className="h-64 animate-pulse rounded-2xl bg-zinc-100" />}>
      <Customer params={params} />
    </Suspense>
  );
}

async function Customer({ params }) {
  await requireUser();
  const { id } = await params;
  const { customers, orders } = await readStore();
  const customer = customers.find((c) => c.id === id);
  if (!customer) notFound();

  const theirs = orders
    .filter((o) => o.customerId === customer.id)
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt));
  const live = theirs.filter((o) => o.status !== "cancelled");
  const spend = live.reduce((sum, o) => sum + o.total, 0);

  return (
    <>
      <PageHeader title={customer.name} description={customer.email} />

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <Card title="Details">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Phone</dt>
              <dd className="mt-0.5">{customer.phone || "—"}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Emirate</dt>
              <dd className="mt-0.5">{customer.emirate}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Joined</dt>
              <dd className="mt-0.5">{formatDate(customer.createdAt)}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Orders</dt>
              <dd className="mt-0.5">{theirs.length}</dd>
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">Spend</dt>
              <dd className="mt-0.5 font-semibold">{formatAed(spend)}</dd>
            </div>
          </dl>
        </Card>

        <Card title="Orders" padded={false}>
          {theirs.length === 0 ? (
            <p className="p-5 text-sm text-zinc-500">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-zinc-100">
              {theirs.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 px-5 py-3">
                  <div>
                    <Link href={`/cms/orders/${o.id}`} className="text-sm font-bold hover:text-brand-700">
                      {o.id}
                    </Link>
                    <p className="text-[11px] text-zinc-500">{formatDateTime(o.placedAt)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold">{formatAed(o.total)}</span>
                    <Badge tone={orderTone[o.status]}>
                      {ORDER_STATUSES.find((s) => s.id === o.status)?.label}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
