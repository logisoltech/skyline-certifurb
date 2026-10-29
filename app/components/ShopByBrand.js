import Image from "next/image";
import Link from "next/link";

const BRANDS = [
  { name: "HP", slug: "hp", logo: "/categories-hp.png" },
  { name: "Dell", slug: "dell", logo: "/categories-dell.png" },
  { name: "Lenovo", slug: "lenovo", logo: "/categories-lenovo.png" },
  {
    name: "Microsoft Surface",
    slug: "microsoft",
    logo: "/categories-microsoft.png",
  },
  { name: "Apple MacBook", slug: "apple", logo: "/categories-apple.png" },
  { name: "Samsung", slug: "samsung", logo: "/categories-samsung.png" },
  { name: "Acer", slug: "acer", logo: "/categories-acer.png" },
  { name: "ASUS", slug: "asus", logo: "/categories-asus.png" },
];

export default function ShopByBrand() {
  return (
    <section aria-labelledby="shop-by-brand" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-12">
        <h2
          id="shop-by-brand"
          className="text-center text-lg font-bold tracking-tight text-brand-950 sm:text-xl"
        >
          Shop by Brand
        </h2>

        <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          {BRANDS.map(({ name, slug, logo }) => (
            <li key={slug}>
              <Link
                href={`/laptops?brand=${slug}`}
                className="group flex h-full flex-col items-center justify-center gap-3 rounded-2xl border border-zinc-200 bg-white px-3 py-5 transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-[0_12px_30px_-12px_rgba(22,101,52,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <Image
                  src={logo}
                  alt=""
                  width={100}
                  height={100}
                  className="h-10 w-10 object-contain"
                />
                <span className="text-center text-xs font-semibold text-zinc-800 transition group-hover:text-brand-700">
                  {name}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
