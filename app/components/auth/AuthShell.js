import { CheckIcon } from "../Icons";

const PERKS = [
  "Track every order from inspection to your door",
  "Save laptops to your wishlist and come back anytime",
  "Keep your delivery addresses ready for faster checkout",
  "Manage your 6-month warranty and 15-day returns",
];

export default function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="flex-1 bg-linear-to-br from-brand-50 via-white to-brand-100/60 px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto grid max-w-5xl overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-[0_30px_80px_-30px_rgba(22,101,52,0.4)] lg:grid-cols-[5fr_6fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-brand-950 p-10 text-white lg:flex">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-brand-600/30 blur-3xl"
          />
          <div
            aria-hidden
            className="pointer-events-none absolute -bottom-28 -left-16 h-72 w-72 rounded-full bg-brand-400/20 blur-3xl"
          />
          <div className="relative">
            <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">
              Your Certifurb account
            </p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight">
              Renewed laptops, backed by people you can reach.
            </h2>
          </div>
          <ul className="relative mt-10 space-y-4">
            {PERKS.map((perk) => (
              <li key={perk} className="flex items-start gap-3 text-[13px] leading-snug text-white/80">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-500/25 text-brand-300">
                  <CheckIcon width={12} height={12} strokeWidth={3} />
                </span>
                {perk}
              </li>
            ))}
          </ul>
        </aside>

        <section className="p-6 sm:p-10">
          <h1 className="text-2xl font-extrabold tracking-tight text-brand-950 sm:text-3xl">
            {title}
          </h1>
          {subtitle && <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>}
          <div className="mt-7">{children}</div>
          {footer && (
            <p className="mt-7 border-t border-zinc-100 pt-6 text-center text-xs text-zinc-600">
              {footer}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
