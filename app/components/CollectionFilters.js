"use client";

import { useState } from "react";
import {
  FACETS,
  facetCount,
  facetOptions,
  priceBounds,
} from "../lib/collection";
import { ChevronDownIcon } from "./Icons";

function Group({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = `filter-${title.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <section className="border-b border-zinc-200 py-4 last:border-b-0">
      <h3>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex w-full items-center justify-between border-b-2 border-brand-950 pb-1.5 text-left text-xs font-bold text-brand-950 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
        >
          {title}
          <ChevronDownIcon
            width={14}
            height={14}
            className={`text-zinc-400 transition ${open ? "rotate-180" : ""}`}
          />
        </button>
      </h3>
      <div id={id} hidden={!open} className="mt-3">
        {children}
      </div>
    </section>
  );
}

function CheckboxList({ facet, products, filters, onToggle, scroll = false }) {
  const options = facetOptions(products, facet);
  if (options.length === 0) return null;

  return (
    <ul
      className={`space-y-2 ${scroll ? "max-h-44 overflow-y-auto pr-1" : ""}`}
    >
      {options.map((value) => {
        const checked = filters[facet].includes(value);
        const count = facetCount(products, filters, facet, value);
        const disabled = count === 0 && !checked;
        return (
          <li key={String(value)}>
            <label
              className={`flex cursor-pointer items-center gap-2.5 text-[12px] ${
                disabled ? "cursor-not-allowed text-zinc-400" : "text-zinc-700"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(facet, value)}
                className="h-3.5 w-3.5 shrink-0 cursor-pointer accent-brand-600"
              />
              <span>
                {FACETS[facet].label(value)}
                <span className="text-zinc-400">({count})</span>
              </span>
            </label>
          </li>
        );
      })}
    </ul>
  );
}

function ChipList({ facet, products, filters, onToggle }) {
  const options = facetOptions(products, facet);
  if (options.length === 0) return null;

  return (
    <ul className="flex flex-wrap gap-2">
      {options.map((value) => {
        const selected = filters[facet].includes(value);
        const count = facetCount(products, filters, facet, value);
        const disabled = count === 0 && !selected;
        return (
          <li key={String(value)}>
            <button
              type="button"
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => onToggle(facet, value)}
              className={`rounded-md border px-2.5 py-1.5 text-[11px] font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
                selected
                  ? "border-brand-600 bg-brand-50 text-brand-800"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-brand-500"
              } ${disabled ? "cursor-not-allowed opacity-40 hover:border-zinc-200" : ""}`}
            >
              {FACETS[facet].label(value)}
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function PriceFilter({ bounds, value, onApply }) {
  const [min, max] = bounds;
  const [lo, setLo] = useState(value ? value[0] : min);
  const [hi, setHi] = useState(value ? value[1] : max);

  const loNum = Number(lo) || min;
  const hiNum = Number(hi) || max;
  const pct = (v) => (max === min ? 0 : ((v - min) / (max - min)) * 100);

  function apply() {
    let a = Math.min(Math.max(Number(lo) || min, min), max);
    let b = Math.min(Math.max(Number(hi) || max, min), max);
    if (a > b) [a, b] = [b, a];
    setLo(a);
    setHi(b);
    onApply(a === min && b === max ? null : [a, b]);
  }

  return (
    <div>
      <div className="dual-range relative mx-1 h-6">
        <div className="absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full bg-zinc-200" />
        <div
          className="absolute top-1/2 h-1 -translate-y-1/2 rounded-full bg-brand-600"
          style={{
            left: `${pct(loNum)}%`,
            width: `${Math.max(pct(hiNum) - pct(loNum), 0)}%`,
          }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={10}
          value={loNum}
          aria-label="Minimum price"
          onChange={(e) => setLo(Math.min(Number(e.target.value), hiNum))}
          style={{ zIndex: loNum > (min + max) / 2 ? 5 : 3 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={10}
          value={hiNum}
          aria-label="Maximum price"
          onChange={(e) => setHi(Math.max(Number(e.target.value), loNum))}
          style={{ zIndex: 4 }}
        />
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11px] text-zinc-500">
        <label className="flex min-w-0 flex-1 items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 focus-within:border-brand-600">
          <span className="font-semibold text-zinc-500">AED</span>
          <input
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={lo}
            aria-label="Minimum price in AED"
            onChange={(e) => setLo(e.target.value)}
            className="w-full min-w-0 bg-transparent text-right text-xs font-medium text-zinc-800 outline-none"
          />
        </label>
        <span>to</span>
        <label className="flex min-w-0 flex-1 items-center gap-1 rounded-md border border-zinc-300 bg-white px-2 py-1.5 focus-within:border-brand-600">
          <span className="font-semibold text-zinc-500">AED</span>
          <input
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            value={hi}
            aria-label="Maximum price in AED"
            onChange={(e) => setHi(e.target.value)}
            className="w-full min-w-0 bg-transparent text-right text-xs font-medium text-zinc-800 outline-none"
          />
        </label>
      </div>

      <button
        type="button"
        onClick={apply}
        className="mt-3 h-10 w-full rounded-full bg-brand-600 text-[11px] font-bold uppercase tracking-wide text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        Apply
      </button>
    </div>
  );
}

export default function CollectionFilters({
  products,
  filters,
  activeCount,
  onToggle,
  onApplyPrice,
  onClear,
}) {
  const bounds = priceBounds(products);
  const hasGeneration = facetOptions(products, "generation").length > 0;
  const common = { products, filters, onToggle };

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-brand-950">
            Filter your shortlist
          </h2>
          <p className="mt-1 text-[10px] leading-snug text-zinc-500">
            Choose from the available filters to find your next computer.
          </p>
        </div>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={onClear}
            className="shrink-0 text-[11px] font-bold text-brand-700 underline underline-offset-2 hover:text-brand-900"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="mt-3 border-t border-zinc-200">
        <Group title="Brand">
          <CheckboxList facet="brand" {...common} />
        </Group>
        <Group title="RAM">
          <ChipList facet="ram" {...common} />
        </Group>
        <Group title="SSD">
          <ChipList facet="ssd" {...common} />
        </Group>
        {hasGeneration && (
          <Group title="Generation">
            <CheckboxList facet="generation" {...common} />
          </Group>
        )}
        <Group title="Screen size">
          <ChipList facet="screen" {...common} />
        </Group>
        <Group title="Processor Type">
          <CheckboxList facet="processor" scroll {...common} />
        </Group>
        <Group title="Availability">
          <CheckboxList facet="availability" {...common} />
        </Group>
        <Group title="Price">
          <PriceFilter
            key={filters.price ? filters.price.join("-") : "all"}
            bounds={bounds}
            value={filters.price}
            onApply={onApplyPrice}
          />
        </Group>
      </div>
    </div>
  );
}
