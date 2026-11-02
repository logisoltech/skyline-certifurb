import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import OrderStatusForm from "../../../../components/cms/OrderStatusForm";
import { Badge, Card, PageHeader, formatAed, formatDateTime, orderTone } from "../../../../components/cms/ui";
import { requireUser } from "../../../../lib/cms/auth";
import { ORDER_STATUSES, can } from "../../../../lib/cms/constants";
import { readStore } from "../../../../lib/cms/db";

export const metadata = { title: "Order" };

export default function OrderPage({ params }) {
  return (
    <Suspense fallback={<div aria-hidden className="h-64 animate-pulse rounded-2xl bg-zinc-100" />}>
      <Order params={params} />
    </Suspense>
  );
}

async function Order({ params }) {
  const [{ id }, user, store] = await Promise.all([params, requireUser(), readStore()]);
  const order = store.orders.find((o) => o.id === id);
  if (!order) notFound();
  const customer = store.customers.find((c) => c.id === order.customerId);
  const canWrite = can(user.role, "orders:write");

  return (
    <>
      <PageHeader title={order.id} description={`Placed ${formatDateTime(order.placedAt)}`}>
        <Badge tone={orderTone[order.status]}>
          {ORDER_STATUSES.find((s) => s.id === order.status)?.label}
        </Badge>
      </PageHeader>

      <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-6">
          <Card title="Items" padded={false}>
            <ul className="divide-y divide-zinc-100">
              {order.items.map((item) => (
                <li key={item.slug} className="flex items-start justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <Link
                      href={`/laptops/${item.slug}`}
                      target="_blank"
                      className="text-sm font-semibold text-zinc-900 hover:text-brand-700"
                    >
                      {item.title}
                    </Link>
                    <p className="text-[11px] text-zinc-500">
                      Qty {item.qty} · {formatAed(item.price)} each
                    </p>
                  </div>
                  <p className="whitespace-nowrap text-sm font-bold">{formatAed(item.price * item.qty)}</p>
                </li>
              ))}
            </ul>
            <p className="flex justify-between border-t border-zinc-100 px-5 py-4 text-sm font-extrabold">
              <span>Total</span>
              <span>{formatAed(order.total)}</span>
            </p>
          </Card>

          <Card title="Customer">
            {customer ? (
              <dl className="grid gap-2 text-sm">
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Name</dt>
                  <dd>
                    <Link href={`/cms/customers/${customer.id}`} className="font-semibold hover:text-brand-700">
                      {customer.name}
                    </Link>
                  </dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Email</dt>
                  <dd>{customer.email}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Phone</dt>
                  <dd>{customer.phone}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Emirate</dt>
                  <dd>{order.emirate}</dd>
                </div>
                <div className="flex justify-between gap-4">
                  <dt className="text-zinc-500">Payment</dt>
                  <dd>{order.payment}</dd>
                </div>
              </dl>
            ) : (
              <p className="text-sm text-zinc-500">Customer record missing.</p>
            )}
          </Card>
        </div>

        <Card title="Fulfilment">
          {canWrite ? (
            <OrderStatusForm orderId={order.id} status={order.status} />
          ) : (
            <p className="text-sm text-zinc-600">
              {ORDER_STATUSES.find((s) => s.id === order.status)?.label}
            </p>
          )}
          {order.sample && (
            <p className="mt-4 text-[11px] leading-relaxed text-zinc-500">
              Sample order for the dashboard. It isn't linked to a real checkout.
            </p>
          )}
        </Card>
      </div>
    </>
  );
}
