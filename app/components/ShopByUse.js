import Link from "next/link";
import {
  ArrowRightIcon,
  BriefcaseIcon,
  GraduationCapIcon,
  MonitorIcon,
  SparkleIcon,
  TabletIcon,
} from "./Icons";

const USES = [
  {
    title: "Student Laptops",
    text: "Light & affordable",
    slug: "student",
    icon: GraduationCapIcon,
  },
  {
    title: "Business Laptops",
    text: "Pro & secure",
    slug: "business",
    icon: BriefcaseIcon,
  },
  {
    title: "Touchscreen Laptops",
    text: "Tap & go",
    slug: "touchscreen",
    icon: TabletIcon,
  },
  {
    title: "2-in-1 Laptops",
    text: "Laptop + tablet",
    slug: "2-in-1",
    icon: MonitorIcon,
  },
  {
    title: "Premium / Performance",
    text: "Maximum power",
    slug: "premium",
    icon: SparkleIcon,
  },
];

export default function ShopByUse() {
  return (
    <section aria-labelledby="shop-by-use" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
            What&apos;s it for?
          </p>
          <h2
            id="shop-by-use"
            className="mt-3 text-3xl font-extrabold tracking-tight text-brand-950 sm:text-4xl"
          >
            Shop by Use
          </h2>
          <p className="mt-4 text-sm text-zinc-500">
            Start with what you need the laptop to do.
          </p>
        </div>

        <ul className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {USES.map(({ title, text, slug, icon: Icon }) => (
            <li key={slug}>
              <Link
                href={`/laptops?use=${slug}`}
                className="group flex h-full flex-col rounded-2xl border border-zinc-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-brand-500 hover:shadow-[0_12px_30px_-12px_rgba(22,101,52,0.35)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon width={22} height={22} />
                </span>
                <h3 className="mt-5 text-sm font-bold text-brand-950">
                  {title}
                </h3>
                <p className="mt-1.5 text-xs text-zinc-500">{text}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-brand-700">
                  Shop now
                  <ArrowRightIcon
                    width={13}
                    height={13}
                    className="transition group-hover:translate-x-0.5"
                  />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
