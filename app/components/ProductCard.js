import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "../data/products";

export default function ProductCard({ product }) {
  const href = `/laptops/${product.slug}`;
  const outOfStock = product.inStock === false;

  return (
    <li className="h-full">
      <article className="group flex h-full flex-col rounded-3xl border border-zinc-200 bg-white p-3 transition hover:border-brand-300 hover:shadow-[0_18px_40px_-18px_rgba(22,101,52,0.35)]">
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden
          className="relative block aspect-16/10 overflow-hidden rounded-2xl bg-linear-to-b from-brand-50/60 to-white"
        >
          <Image
            src={product.image}
            alt=""
            fill
            sizes="(min-width: 1280px) 240px, (min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className={`object-contain p-2 transition duration-500 group-hover:scale-105 ${
              outOfStock ? "opacity-60 grayscale-30" : ""
            }`}
          />
        </Link>

        <div className="mt-2 rounded-2xl bg-brand-50/70 p-2">
          {outOfStock ? (
            <Link
              href={href}
              className="flex h-10 w-full items-center justify-center rounded-full border border-zinc-300 bg-white text-xs font-bold text-zinc-500 transition hover:border-brand-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Out of stock
            </Link>
          ) : (
            <Link
              href={href}
              className="flex h-10 w-full items-center justify-center rounded-full bg-brand-950 text-xs font-bold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
            >
              Choose options
            </Link>
          )}
        </div>

        <div className="flex flex-1 flex-col px-1.5 pt-3">
          <h3 className="line-clamp-3 text-[13px] font-medium leading-snug text-zinc-800">
            <Link href={href} className="hover:text-brand-700">
              {product.title}
            </Link>
          </h3>

          <ul className="mt-3 flex flex-wrap gap-1.5">
            {product.specs.map((spec) => (
              <li
                key={spec}
                className="rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[10px] font-medium text-zinc-600"
              >
                {spec}
              </li>
            ))}
          </ul>

          <p className="mt-3 flex items-center gap-2 text-[10px] font-semibold text-zinc-500">
            <span
              className={
                product.condition === "Excellent"
                  ? "text-brand-700"
                  : "text-amber-600"
              }
            >
              {product.condition}
            </span>
            <span>{product.warranty}</span>
          </p>

          <p className="mt-auto pb-3 pt-5 text-center text-base font-extrabold text-brand-950">
            {formatPrice(product.price)}
          </p>
        </div>
      </article>
    </li>
  );
}
