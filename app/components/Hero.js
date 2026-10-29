import Link from "next/link";
import BannerCarousel from "./BannerCarousel";
import {
  LaptopCheckIcon,
  ReturnIcon,
  ShieldCheckIcon,
  TruckIcon,
} from "./Icons";

const POPULAR = ["Student", "Business", "Touchscreen"];

const TRUST_ITEMS = [
  {
    icon: LaptopCheckIcon,
    title: "Tested before dispatch",
    text: "Professionally checked in Sharjah",
  },
  {
    icon: ShieldCheckIcon,
    title: "6-month warranty",
    text: "Local UAE support",
  },
  {
    icon: ReturnIcon,
    title: "15-day easy returns",
    text: "See our return policy for terms",
  },
  {
    icon: TruckIcon,
    title: "Free UAE delivery over AED 99",
    text: "2–3 working days · COD & Tabby",
  },
];

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-linear-to-br from-brand-50 via-white to-brand-100/70">
      {/* Decorative glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-brand-200/50 blur-3xl"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 -left-24 h-96 w-96 rounded-full bg-brand-100 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-10 sm:px-6 lg:pt-16">
        <div className="grid items-center gap-10 lg:grid-cols-[4.5fr_7.5fr] lg:gap-12">
          {/* Copy */}
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white/80 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-brand-800">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
              Renewed laptops, local UAE support
            </span>

            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight text-brand-950 sm:text-5xl xl:text-6xl">
              Renewed laptops.{" "}
              <span className="text-brand-600">Ready for your next chapter.</span>
            </h1>

            <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-600">
              Business laptops from AED 899. 6-month warranty · 15-day easy
              returns.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/laptops"
                className="inline-flex h-11 items-center rounded-full bg-brand-950 px-6 text-sm font-semibold text-white transition hover:bg-brand-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Shop renewed laptops
              </Link>
              <Link
                href="/laptops?price=899-999"
                className="inline-flex h-11 items-center rounded-full border border-brand-200 bg-white px-6 text-sm font-semibold text-brand-950 transition hover:border-brand-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                Shop AED 899–999
              </Link>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
              <span>Popular:</span>
              {POPULAR.map((tag) => (
                <Link
                  key={tag}
                  href={`/laptops?use=${tag.toLowerCase()}`}
                  className="rounded-full border border-brand-100 bg-white px-3 py-1.5 font-medium text-zinc-700 transition hover:border-brand-600 hover:text-brand-700"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>

          {/* Banner carousel */}
          <BannerCarousel />
        </div>

        {/* Trust strip */}
        <ul className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_ITEMS.map(({ icon: Icon, title, text }) => (
            <li
              key={title}
              className="flex items-center gap-3 rounded-xl border border-brand-100 bg-white/90 px-4 py-3.5 shadow-sm"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <Icon width={18} height={18} />
              </span>
              <div className="leading-tight">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="mt-0.5 text-xs text-zinc-500">{text}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
