import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ReturnIcon, ShieldCheckIcon, TruckIcon } from "../../../components/Icons";
import ProductCard from "../../../components/ProductCard";
import ProductBuyBox from "../../../components/product/ProductBuyBox";
import ProductGallery from "../../../components/product/ProductGallery";
import {
  BRAND_NAMES,
  formatPrice,
  formatStorage,
  ordinal,
} from "../../../data/products";
import { getCatalog } from "../../../lib/catalog";

// Pages for the products that exist now are prerendered. Products added in the
// CMS later are rendered on first request (and when the CMS changes anything
// the catalogue cache is refreshed).
export async function generateStaticParams() {
  const catalog = await getCatalog();
  // Cache Components needs at least one sample param, even for an empty shop.
  return catalog.length > 0
    ? catalog.map((product) => ({ slug: product.slug }))
    : [{ slug: "__none__" }];
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const product = (await getCatalog()).find((p) => p.slug === slug);
  if (!product) return {};
  return {
    title: `${product.title} | Certifurb`,
    description: `${product.title}. Professionally inspected and ${product.condition.toLowerCase()} condition, with a ${product.warranty} and 15-day easy returns. ${formatPrice(product.price)}.`,
  };
}

const PERKS = [
  { icon: ShieldCheckIcon, title: "6-month warranty", text: "Covered by our Sharjah workshop." },
  { icon: ReturnIcon, title: "15-day returns", text: "Not right for you? Send it back." },
  { icon: TruckIcon, title: "2–3 working days", text: "Cash on delivery or Tabby." },
];

function joinOptions(values, format) {
  const nums = [...new Set(values.filter((v) => v !== null && v !== undefined))].sort((a, b) => a - b);
  return nums.map(format).join(" or ");
}

function specRows(product) {
  const rams = product.rams ?? [product.ram];
  const ssds = product.ssds ?? [product.ssd];
  return [
    ["Brand", BRAND_NAMES[product.brand] ?? product.brand],
    ["Processor", product.processor],
    product.generation && ["Generation", `${ordinal(product.generation)} Gen`],
    ["Memory (RAM)", joinOptions(rams, (n) => `${n}GB`)],
    ["Storage", joinOptions(ssds, (n) => `${formatStorage(n)} SSD`)],
    ["Screen size", `${product.screen} inch`],
    ["Touchscreen", product.touch ? "Yes" : "No"],
    product.twoInOne && ["Form factor", "2-in-1 convertible"],
    ["Condition", product.condition],
    ["Warranty", product.warranty],
  ].filter(Boolean);
}

function ProductSkeleton() {
  return (
    <div aria-hidden className="mx-auto max-w-7xl animate-pulse px-4 pb-16 pt-4 sm:px-6">
      <div className="h-3 w-40 rounded bg-zinc-200" />
      <div className="mt-4 grid gap-8 lg:grid-cols-[1.05fr_1fr]">
        <div className="aspect-4/3 rounded-3xl bg-brand-50" />
        <div className="space-y-4">
          <div className="h-3 w-32 rounded bg-zinc-200" />
          <div className="h-16 rounded-2xl bg-zinc-100" />
          <div className="h-10 w-40 rounded-2xl bg-zinc-100" />
          <div className="h-12 rounded-full bg-zinc-100" />
        </div>
      </div>
    </div>
  );
}

// `params` is request data, so it's read inside <Suspense> (required with
// Cache Components). The shell around it stays static.
export default function ProductPage({ params }) {
  return (
    <main className="flex-1">
      <Suspense fallback={<ProductSkeleton />}>
        <Product params={params} />
      </Suspense>
    </main>
  );
}

async function Product({ params }) {
  const { slug } = await params;
  const catalog = await getCatalog();
  const product = catalog.find((p) => p.slug === slug);
  if (!product) notFound();

  const brandName = BRAND_NAMES[product.brand] ?? product.brand;
  const outOfStock = product.inStock === false;

  // Same brand first, then fill with other laptops.
  const related = [
    ...catalog.filter((p) => p.brand === product.brand && p.slug !== product.slug),
    ...catalog.filter((p) => p.brand !== product.brand),
  ].slice(0, 4);

  return (
    <>
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-4 sm:px-6">
        <nav aria-label="Breadcrumb" className="text-[11px] text-zinc-500">
          <ol className="flex flex-wrap items-center gap-1.5">
            <li>
              <Link href="/" className="hover:text-brand-700">Home</Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href="/laptops" className="hover:text-brand-700">Laptops</Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={`/laptops?brand=${product.brand}`} className="hover:text-brand-700">
                {brandName}
              </Link>
            </li>
          </ol>
        </nav>

        <div className="mt-4 grid gap-8 lg:grid-cols-[1.05fr_1fr]">
          <ProductGallery images={product.images ?? [product.image]} title={product.title} outOfStock={outOfStock} />

          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-brand-600">
              {brandName} · Renewed
            </p>
            <h1 className="mt-2 text-xl font-extrabold leading-snug text-brand-950 sm:text-2xl">
              {product.title}
            </h1>

            <ul className="mt-4 flex flex-wrap gap-1.5">
              {product.specs.map((spec) => (
                <li
                  key={spec}
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1 text-[11px] font-medium text-zinc-600"
                >
                  {spec}
                </li>
              ))}
            </ul>

            <div className="mt-5">
              <ProductBuyBox product={product} />
            </div>

            <ul className="mt-6 grid gap-3 border-t border-zinc-100 pt-6 sm:grid-cols-3">
              {PERKS.map(({ icon: Icon, title, text }) => (
                <li key={title} className="rounded-2xl bg-brand-50/70 p-3">
                  <Icon width={20} height={20} className="text-brand-600" />
                  <p className="mt-2 text-xs font-bold text-brand-950">{title}</p>
                  <p className="mt-0.5 text-[11px] leading-snug text-zinc-600">{text}</p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <section aria-labelledby="specs" className="mt-12 max-w-3xl">
          <h2 id="specs" className="text-lg font-extrabold text-brand-950">
            Specifications
          </h2>
          <dl className="mt-4 divide-y divide-zinc-100 overflow-hidden rounded-3xl border border-zinc-200 bg-white">
            {specRows(product).map(([label, value]) => (
              <div key={label} className="grid grid-cols-[140px_1fr] gap-4 px-5 py-3 text-sm">
                <dt className="text-zinc-500">{label}</dt>
                <dd className="font-semibold text-zinc-900">{value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="related" className="mt-14">
          <h2 id="related" className="text-lg font-extrabold text-brand-950">
            You might also like
          </h2>
          <ul className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {related.map((item) => (
              <ProductCard key={item.slug} product={item} />
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
