import { Suspense } from "react";
import ProductForm from "../../../../components/cms/ProductForm";
import { PageHeader } from "../../../../components/cms/ui";
import { requireUser } from "../../../../lib/cms/auth";

export const metadata = { title: "Add product" };

function FormSkeleton() {
  return <div aria-hidden className="h-[32rem] animate-pulse rounded-2xl bg-zinc-100" />;
}

export default function NewProductPage() {
  return (
    <Suspense fallback={<FormSkeleton />}>
      <New />
    </Suspense>
  );
}

async function New() {
  await requireUser("products:write");

  return (
    <>
      <PageHeader title="Add product" description="One listing, with photos and RAM / storage options. Drafts stay hidden until you publish them." />
      <ProductForm canWrite />
    </>
  );
}
