import {
  HeadsetIcon,
  MapPinIcon,
  ReturnIcon,
  SearchIcon,
  ShieldCheckIcon,
  SparkleIcon,
} from "./Icons";

const REASONS = [
  {
    icon: SearchIcon,
    title: "Professionally inspected",
    text: "Hardware and everyday functions are checked before dispatch.",
  },
  {
    icon: ShieldCheckIcon,
    title: "6-month warranty",
    text: "Local UAE warranty support. Contact our Sharjah team for help.",
  },
  {
    icon: ReturnIcon,
    title: "15-day easy returns",
    text: "See our refund policy for eligibility and return arrangements.",
  },
  {
    icon: MapPinIcon,
    title: "UAE-Based Store",
    text: "Free UAE delivery over AED 99 in 2–3 working days. For same-day delivery in Ajman, Sharjah or Dubai, contact us early to confirm availability and any charge.",
  },
  {
    icon: SparkleIcon,
    title: "Professionally Renewed",
    text: "Cleaned, prepared and function-tested for dependable everyday use.",
  },
  {
    icon: HeadsetIcon,
    title: "WhatsApp Support",
    text: "Chat with our team during shop hours for help choosing a laptop.",
  },
];

export default function WhyBuy() {
  return (
    <section
      aria-labelledby="why-buy"
      className="bg-linear-to-b from-brand-50 to-brand-50/60"
    >
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
            The Certifurb promise
          </p>
          <h2
            id="why-buy"
            className="mt-3 text-3xl font-extrabold tracking-tight text-brand-950 sm:text-4xl"
          >
            Why Buy From Certifurb
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
            Renewed the right way — inspected, warrantied and supported, here in
            the UAE.
          </p>
        </div>

        <ul className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {REASONS.map(({ icon: Icon, title, text }) => (
            <li key={title}>
              <article className="group h-full rounded-2xl border border-brand-100 bg-white p-6 transition hover:-translate-y-0.5 hover:border-brand-300 hover:shadow-[0_16px_40px_-18px_rgba(22,101,52,0.35)]">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
                  <Icon width={20} height={20} />
                </span>
                <h3 className="mt-5 text-sm font-bold text-brand-950">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                  {text}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
