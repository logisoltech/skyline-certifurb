// Shared CMS building blocks. No hooks here, so it works in server and client
// components alike.

export const btnPrimary =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-950 px-4 text-xs font-bold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60";

export const btnSecondary =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-4 text-xs font-bold text-zinc-800 transition hover:border-zinc-400 hover:bg-zinc-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60";

export const btnDanger =
  "inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-lg border border-red-200 bg-white px-4 text-xs font-bold text-red-600 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 disabled:cursor-not-allowed disabled:opacity-60";

export const inputClass =
  "h-10 w-full rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15 disabled:bg-zinc-50 disabled:text-zinc-500 aria-invalid:border-red-500";

// Same look as inputClass, but width is left to the caller (filters, etc.).
export const controlClass =
  "h-10 rounded-lg border border-zinc-300 bg-white px-3 text-sm text-zinc-900 outline-none transition focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15 disabled:bg-zinc-50 disabled:text-zinc-500";

// ---- date formatting (fixed timezone so server and browser agree) ---------

const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Dubai",
});
const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Dubai",
});

export const formatDate = (iso) => (iso ? dateFormat.format(new Date(iso)) : "—");
export const formatDateTime = (iso) => (iso ? dateTimeFormat.format(new Date(iso)) : "—");
export const formatAed = (n) => `AED ${Number(n || 0).toLocaleString("en-US")}`;

// ---- layout ---------------------------------------------------------------

export function PageHeader({ title, description, children }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-xl font-extrabold tracking-tight text-zinc-900 sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-zinc-500">{description}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  );
}

export function Card({ title, description, action, children, className = "", padded = true }) {
  return (
    <section className={`rounded-2xl border border-zinc-200 bg-white ${className}`}>
      {(title || action) && (
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-5 py-3.5">
          <div>
            <h2 className="text-sm font-extrabold text-zinc-900">{title}</h2>
            {description && <p className="mt-0.5 text-xs text-zinc-500">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  );
}

export function Field({ label, htmlFor, error, hint, children, className = "" }) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1.5 block text-xs font-bold text-zinc-800">
        {label}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-[11px] text-zinc-500">{hint}</p>}
      {error && (
        <p role="alert" className="mt-1 text-[11px] font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

const TONES = {
  green: "bg-brand-100 text-brand-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-700",
  blue: "bg-sky-100 text-sky-800",
  zinc: "bg-zinc-100 text-zinc-700",
};

export function Badge({ tone = "zinc", children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${TONES[tone]}`}>
      {children}
    </span>
  );
}

export function Notice({ tone = "info", children, className = "" }) {
  const styles = {
    info: "border-sky-200 bg-sky-50 text-sky-900",
    success: "border-brand-200 bg-brand-50 text-brand-900",
    warning: "border-amber-200 bg-amber-50 text-amber-900",
    error: "border-red-200 bg-red-50 text-red-800",
  };
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-xs leading-relaxed ${styles[tone]} ${className}`}
    >
      {children}
    </div>
  );
}

export function StatCard({ label, value, hint, tone }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5">
      <p className="text-xs font-semibold text-zinc-500">{label}</p>
      <p className={`mt-2 text-2xl font-extrabold tracking-tight ${tone === "red" ? "text-red-600" : tone === "amber" ? "text-amber-600" : "text-zinc-900"}`}>
        {value}
      </p>
      {hint && <p className="mt-1 text-[11px] text-zinc-500">{hint}</p>}
    </div>
  );
}

export const orderTone = {
  placed: "blue",
  preparing: "amber",
  dispatched: "blue",
  delivered: "green",
  cancelled: "red",
};
