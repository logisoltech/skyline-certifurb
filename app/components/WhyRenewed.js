import Link from "next/link";

const COMPARISONS = [
  {
    title: "Compare the price",
    text: "Choose the specification you need from AED 899. A saving in AED is shown only when a genuine comparison price is documented.",
  },
  {
    title: "Business-class build",
    text: "A renewed EliteBook, Latitude or ThinkPad keeps its original business-class design. Compare processor generation, memory, storage and condition before choosing.",
  },
  {
    title: "Local support included",
    text: "6-month warranty and 15-day easy returns, with help from our Sharjah team. Read the product condition and policy terms for your chosen laptop.",
  },
];

const LINKS = [
  { label: "Browse renewed laptops", href: "/laptops" },
  { label: "Delivery, payments and FAQs", href: "/faqs" },
  { label: "Visit our Sharjah showroom", href: "/store" },
];

export default function WhyRenewed() {
  return (
    <section
      aria-labelledby="why-renewed"
      className="border-t border-brand-100 bg-white"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <h2
          id="why-renewed"
          className="text-lg font-bold tracking-tight text-brand-950"
        >
          Why buy a renewed laptop from Certifurb
        </h2>

        <div className="mt-4 space-y-4 text-[13px] leading-relaxed text-zinc-600">
          <p>
            Find a renewed business laptop for work, study or everyday use, with
            local support from our shop in Sharjah. Browse HP EliteBook, Dell
            Latitude, Lenovo ThinkPad, Microsoft Surface and Apple models, with
            featured laptops from AED 899.
          </p>
          <p>
            Our offer is clear: 6-month warranty · 15-day easy returns · free
            UAE delivery over AED 99 in 2–3 working days. We deliver to Dubai,
            Sharjah, Abu Dhabi and all seven emirates. Pay with Cash on
            Delivery, Tabby, cards, Apple Pay or Google Pay.
          </p>
        </div>

        <div className="mt-6 rounded-2xl border border-brand-100 bg-brand-50/70 p-6 sm:p-7">
          <h3 className="text-sm font-bold text-brand-950">
            Why buy renewed vs new?
          </h3>
          <div className="mt-5 grid gap-6 md:grid-cols-3 md:gap-8">
            {COMPARISONS.map(({ title, text }) => (
              <div key={title}>
                <h4 className="text-[13px] font-bold text-brand-900">
                  {title}
                </h4>
                <p className="mt-2 text-[13px] leading-relaxed text-zinc-600">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        <p className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-zinc-600">
          {LINKS.map(({ label, href }, i) => (
            <span key={label} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden>·</span>}
              <Link
                href={href}
                className="transition hover:text-brand-700 hover:underline"
              >
                {label}
              </Link>
            </span>
          ))}
        </p>
      </div>
    </section>
  );
}
