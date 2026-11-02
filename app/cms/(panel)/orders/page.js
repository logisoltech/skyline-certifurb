import OrdersTable from "../../../components/cms/OrdersTable";
import { Notice, PageHeader } from "../../../components/cms/ui";
import { requireUser } from "../../../lib/cms/auth";
import { readStore } from "../../../lib/cms/db";

export const metadata = { title: "Orders" };

export default async function OrdersPage() {
  const [, { orders, customers }] = await Promise.all([requireUser(), readStore()]);
  const sample = orders.some((o) => o.sample);

  return (
    <>
      <PageHeader title="Orders" description="Every order placed with Certifurb." />
      {sample && (
        <div className="mb-4">
          <Notice tone="info">
            These are sample orders. Checkout isn't live on the storefront yet, so
            nothing here is a real customer purchase.
          </Notice>
        </div>
      )}
      <OrdersTable orders={orders} customers={customers} />
    </>
  );
}
