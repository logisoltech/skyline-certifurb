import { ExternalLinkIcon } from "./Icons";

// TODO: point this at your real Google Business reviews URL.
const GOOGLE_REVIEWS_URL = "#";

const RATING = { score: "4.3", count: 100, checked: "06 Sep 2026" };

const REVIEWS = [
  {
    quote: "I got an excellent laptop from Skyline Computer.",
    author: "Hany El-Assar",
  },
  {
    quote: "Very affordable pricing and quality top notch...",
    author: "sheeraz ahmad",
  },
  {
    quote: "...team is quite helpful",
    author: "Sohaib Hassan",
  },
];

export default function CustomerReviews() {
  return (
    <section aria-labelledby="customer-reviews" className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <h2
            id="customer-reviews"
            className="text-3xl font-extrabold tracking-tight text-brand-950 sm:text-4xl"
          >
            What customers say about Certifurb
          </h2>
          <a
            href={GOOGLE_REVIEWS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 pt-3 text-xs font-semibold text-zinc-700 transition hover:text-brand-700"
          >
            Read our Google reviews
            <ExternalLinkIcon width={13} height={13} />
          </a>
        </div>

        <div className="mt-5 text-xs text-zinc-700">
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>Google store reviews</span>
            <span className="flex items-center gap-1">
              <span aria-hidden className="text-amber-500">
                ★
              </span>
              {RATING.score} out of 5
            </span>
            <a
              href={GOOGLE_REVIEWS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 transition hover:text-brand-700"
            >
              {RATING.count} reviews
            </a>
          </p>
          <p className="mt-1.5 text-[11px] text-brand-700">
            Checked {RATING.checked}
          </p>
        </div>

        <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
          {REVIEWS.map(({ quote, author }) => (
            <li key={author}>
              <figure className="flex h-full min-h-36 flex-col justify-between rounded-2xl border border-zinc-200 bg-white p-5 transition hover:border-brand-300 hover:shadow-[0_12px_30px_-14px_rgba(22,101,52,0.3)]">
                <blockquote className="text-sm leading-relaxed text-zinc-700">
                  {quote}
                </blockquote>
                <figcaption className="mt-6 flex items-center justify-between gap-3 text-[11px]">
                  <span className="font-bold text-brand-950">{author}</span>
                  <a
                    href={GOOGLE_REVIEWS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-zinc-500 transition hover:text-brand-700"
                  >
                    Read on Google
                  </a>
                </figcaption>
              </figure>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
