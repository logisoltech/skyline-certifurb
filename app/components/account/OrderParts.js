import Image from "next/image";
import Link from "next/link";
import {
  ORDER_STATUS,
  ORDER_STEPS,
  describeOrder,
  formatDate,
  formatDateTime,
} from "../../data/orders";
import { formatPrice } from "../../data/products";
import { CheckIcon } from "../Icons";

const TONES = {
  info: "bg-sky-50 text-sky-800 ring-sky-200",
  progress: "bg-amber-50 text-amber-800 ring-amber-200",
  done: "bg-brand-50 text-brand-800 ring-brand-200",
  muted: "bg-zinc-100 text-zinc-600 ring-zinc-200",
};

export function StatusBadge({ status }) {
  const meta = ORDER_STATUS[status];
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${TONES[meta.tone]}`}
    >
      {meta.label}
    </span>
  );
}

export function PageHeading({ title, description, children }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-brand-950 sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 text-sm text-zinc-500">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}

export function EmptyState({ title, text, action }) {
  return (
    <div className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/50 px-6 py-14 text-center">
      <p className="text-sm font-bold text-brand-950">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-zinc-500">
        {text}
      </p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function OrderItems({ order }) {
  const { lines } = describeOrder(order);
  return (
    <ul className="divide-y divide-zinc-100">
      {lines.map(({ product, qty, lineTotal }) => (
        <li key={product.slug} className="flex items-center gap-4 py-3">
          <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-50/70">
            <Image
              src={product.image}
              alt=""
              fill
              sizes="80px"
              className="object-contain p-1"
            />
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/laptops/${product.slug}`}
              className="line-clamp-2 text-[13px] font-medium leading-snug text-zinc-800 hover:text-brand-700"
            >
              {product.title}
            </Link>
            <p className="mt-0.5 text-[11px] text-zinc-500">
              {product.condition} · Qty {qty}
            </p>
          </div>
          <p className="shrink-0 text-[13px] font-bold text-brand-950">
            {formatPrice(lineTotal)}
          </p>
        </li>
      ))}
    </ul>
  );
}

export function OrderTotals({ order }) {
  const { subtotal, total } = describeOrder(order);
  return (
    <dl className="space-y-1.5 text-xs">
      <div className="flex justify-between text-zinc-600">
        <dt>Subtotal</dt>
        <dd>{formatPrice(subtotal)}</dd>
      </div>
      <div className="flex justify-between text-zinc-600">
        <dt>Delivery</dt>
        <dd className="font-semibold text-brand-700">Free</dd>
      </div>
      <div className="flex justify-between border-t border-zinc-100 pt-2 text-sm font-extrabold text-brand-950">
        <dt>Total</dt>
        <dd>{formatPrice(total)}</dd>
      </div>
    </dl>
  );
}

export function OrderAddress({ order }) {
  const a = order.address;
  return (
    <address className="text-xs not-italic leading-relaxed text-zinc-600">
      <span className="font-bold text-zinc-800">{a.name}</span>
      <br />
      {a.line}, {a.area}
      <br />
      {a.emirate}, UAE
      <br />
      {a.phone}
    </address>
  );
}

// Vertical timeline of the stages an order has reached / still has to reach.
export function OrderTimeline({ order }) {
  if (order.status === "cancelled") {
    return (
      <ol className="space-y-5">
        {order.events.map((event) => (
          <li key={event.step} className="flex gap-3">
            <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-600">
              <CheckIcon width={13} height={13} strokeWidth={3} />
            </span>
            <div>
              <p className="text-[13px] font-bold text-zinc-800">
                {event.step === "cancelled" ? "Order cancelled" : "Order placed"}
              </p>
              <p className="text-[11px] text-zinc-500">{formatDateTime(event.at)}</p>
              <p className="mt-1 text-xs text-zinc-600">{event.note}</p>
            </div>
          </li>
        ))}
      </ol>
    );
  }

  const reached = new Map(order.events.map((e) => [e.step, e]));
  const currentIndex = ORDER_STEPS.findIndex((s) => s.id === order.status);

  return (
    <ol>
      {ORDER_STEPS.map((step, i) => {
        const event = reached.get(step.id);
        const done = i <= currentIndex;
        const current = i === currentIndex;
        const last = i === ORDER_STEPS.length - 1;
        return (
          <li key={step.id} className="relative flex gap-3 pb-6 last:pb-0">
            {!last && (
              <span
                aria-hidden
                className={`absolute left-3 top-7 h-[calc(100%-1.75rem)] w-0.5 ${
                  i < currentIndex ? "bg-brand-500" : "bg-zinc-200"
                }`}
              />
            )}
            <span
              aria-hidden
              className={`relative mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ring-4 ring-white ${
                done
                  ? "bg-brand-600 text-white"
                  : "border-2 border-zinc-300 bg-white"
              } ${current && step.id !== "delivered" ? "shadow-[0_0_0_4px_rgba(22,163,74,0.2)]" : ""}`}
            >
              {done && <CheckIcon width={13} height={13} strokeWidth={3} />}
            </span>
            <div className={done ? "" : "opacity-60"}>
              <p className="text-[13px] font-bold text-zinc-800">
                {step.label}
                {current && step.id !== "delivered" && (
                  <span className="ml-2 rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-800">
                    Current
                  </span>
                )}
              </p>
              {event ? (
                <>
                  <p className="text-[11px] text-zinc-500">
                    {formatDateTime(event.at)}
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-zinc-600">
                    {event.note}
                  </p>
                </>
              ) : (
                <p className="text-[11px] text-zinc-500">Not yet</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export function EstimatedDelivery({ order }) {
  if (order.status === "delivered") {
    const delivered = order.events.find((e) => e.step === "delivered");
    return <>Delivered {formatDate(delivered.at)}</>;
  }
  if (order.status === "cancelled" || !order.estimatedDelivery) return null;
  return <>Estimated delivery {formatDate(order.estimatedDelivery)}</>;
}
