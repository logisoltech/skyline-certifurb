import { Suspense } from "react";
import CollectionView from "../components/CollectionView";
import { parseScope, scopeKey } from "../lib/collection";

export const metadata = {
  title: "Renewed Laptops | Certifurb",
  description:
    "Browse professionally inspected renewed laptops by brand, price or use. 6-month warranty and 15-day easy returns.",
};

// Reading searchParams is request-time data, so it lives in its own component
// behind <Suspense> (required with Cache Components).
async function Collection({ searchParams }) {
  const scope = parseScope(await searchParams);
  // `key` resets filters/sort when you jump to a different brand, use or price.
  return <CollectionView key={scopeKey(scope)} scope={scope} />;
}

function CollectionSkeleton() {
  return (
    <div
      aria-hidden
      className="mx-auto max-w-7xl animate-pulse px-4 pb-16 pt-4 sm:px-6"
    >
      <div className="h-3 w-40 rounded bg-zinc-200" />
      <div className="mt-4 grid gap-6 lg:grid-cols-[240px_1fr]">
        <div className="hidden h-[640px] rounded-2xl bg-zinc-100 lg:block" />
        <div>
          <div className="h-32 rounded-3xl bg-brand-50" />
          <div className="mt-4 h-14 rounded-2xl bg-zinc-100" />
          <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-96 rounded-3xl bg-zinc-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LaptopsPage({ searchParams }) {
  return (
    <main className="flex-1">
      <Suspense fallback={<CollectionSkeleton />}>
        <Collection searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
