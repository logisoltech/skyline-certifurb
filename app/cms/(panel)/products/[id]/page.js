import { notFound } from "next/navigation";
import { Suspense } from "react";
import ProductForm from "../../../../components/cms/ProductForm";
import { PageHeader } from "../../../../components/cms/ui";
import { requireUser } from "../../../../lib/cms/auth";
import { can } from "../../../../lib/cms/constants";
import { readStore } from "../../../../lib/cms/db";

export const metadata = { title: "Edit product" };

function FormSkeleton() {
  return <div aria-hidden className="h-[32rem] animate-pulse rounded-2xl bg-zinc-100" />;
}

export default function EditProductPage({ params, searchParams }) {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <Edit params={params} searchParams={searchParams} />
    </Suspense>
  );
}

async function Edit({ params, searchParams }) {
  const [{ id }, query, user, { products }] = await Promise.all([
    params,
    searchParams,
    requireUser(),
    readStore(),
  ]);
  const product = products.find((p) => p.id === id);
  if (!product) notFound();

  return (
    <>
      <PageHeader
        title={product.title}
        description={
          (product.variants?.length ?? 1) > 1
            ? `${product.variants.length} options · from ${product.sku}`
            : product.sku
        }
      />
      <ProductForm
        product={product}
        canWrite={can(user.role, "products:write")}
        justCreated={Boolean(query.created)}
      />
    </>
  );
}
