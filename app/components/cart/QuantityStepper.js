"use client";

import { MAX_QTY } from "../../lib/cart";
import { MinusIcon, PlusIcon } from "../Icons";

const buttonClass =
  "flex h-9 w-9 items-center justify-center text-zinc-700 transition hover:bg-brand-50 hover:text-brand-700 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:text-zinc-300 disabled:hover:bg-transparent";

export default function QuantityStepper({ value, onChange, label, max = MAX_QTY }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="inline-flex items-center overflow-hidden rounded-full border border-zinc-300 bg-white"
    >
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        aria-label="Decrease quantity"
        className={buttonClass}
      >
        <MinusIcon width={15} height={15} />
      </button>
      <output aria-live="polite" className="w-8 text-center text-sm font-bold text-brand-950">
        {value}
      </output>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= max}
        aria-label="Increase quantity"
        className={buttonClass}
      >
        <PlusIcon width={15} height={15} />
      </button>
    </div>
  );
}
