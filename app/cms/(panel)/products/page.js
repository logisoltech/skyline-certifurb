import Link from "next/link";
import ProductsTable from "../../../components/cms/ProductsTable";
import { PageHeader, btnPrimary, btnSecondary } from "../../../components/cms/ui";
import { requireUser } from "../../../lib/cms/auth";
import { can } from "../../../lib/cms/constants";
import { readStore } from "../../../lib/cms/db";

export const metadata = { title: "Products" };

export default async function ProductsPage() {
  const [user, { products, settings }] = await Promise.all([requireUser(), readStore()]);
  const canWrite = can(user.role, "products:write");

  return (
    <>
      <PageHeader title="Products" description="Everything in your catalogue, published or not.">
        {canWrite && (
          <>
            <Link href="/cms/products/import" className={btnSecondary}>Bulk import (CSV)</Link>
            <Link href="/cms/products/new" className={btnPrimary}>Add product</Link>
          </>
        )}
      </PageHeader>
      <ProductsTable products={products} canWrite={canWrite} threshold={settings.lowStockThreshold} />
    </>
  );
}
