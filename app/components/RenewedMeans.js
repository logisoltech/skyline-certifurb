import Link from "next/link";

const STEPS = [
  {
    title: "Pre-owned business laptops",
    text: "Renewed laptops have been previously owned. Check each listing for its specifications and stated condition.",
  },
  {
    title: "Prepared and function-tested",
    text: "Laptops are prepared and function-tested before dispatch.",
  },
  {
    title: "Check your chosen model",
    text: "Review its processor, memory, storage and listed condition. Ask our team if you need more details.",
  },
  {
    title: "Local UAE support",
    text: "6-month warranty · 15-day easy returns. Our Sharjah team can help with product questions and support.",
  },
];

export default function RenewedMeans() {
  return (
    <section aria-labelledby="renewed-means" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="text-center">
          <p className="text-[11px] font-bold uppercase tracking-wide text-brand-700">
            Prepared and function-tested
          </p>
          <h2
            id="renewed-means"
            className="mx-auto mt-3 max-w-xl text-3xl font-extrabold tracking-tight text-brand-950 sm:text-4xl"
          >
            What &ldquo;Renewed&rdquo; Really Means at Certifurb
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-sm text-zinc-500">
            Renewed means pre-owned, prepared and function-tested, with local
            UAE support.
          </p>
        </div>

        <ol className="mt-9 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map(({ title, text }, i) => (
            <li key={title}>
              <div className="h-full rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-[0_12px_30px_-14px_rgba(22,101,52,0.3)]">
                <span
                  aria-hidden
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-950 text-[11px] font-bold text-white"
                >
                  {i + 1}
                </span>
                <h3 className="mt-5 text-sm font-bold text-brand-950">
                  {title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-600">
                  {text}
                </p>
              </div>
            </li>
          ))}
        </ol>

        <div className="mt-9 text-center">
          <Link
            href="/laptops"
            className="inline-flex h-11 items-center rounded-full bg-brand-950 px-7 text-xs font-bold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
          >
            Browse Renewed Laptops
          </Link>
        </div>
      </div>
    </section>
  );
}
