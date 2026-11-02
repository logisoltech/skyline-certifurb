"use client";

import { useMemo, useState } from "react";
import { formatPrice, formatStorage } from "../../data/products";
import AddToCart from "../cart/AddToCart";

function unique(values) {
  return [...new Set(values.filter((v) => v !== null && v !== undefined && v !== ""))];
}

function Chip({ selected, disabled, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={`rounded-full border px-3 py-1.5 text-xs font-bold transition ${
        selected
          ? "border-brand-700 bg-brand-950 text-white"
          : disabled
            ? "cursor-not-allowed border-zinc-200 bg-zinc-50 text-zinc-400"
            : "border-zinc-200 bg-white text-zinc-700 hover:border-brand-400"
      }`}
    >
      {children}
    </button>
  );
}

function cpuOf(variant, product) {
  return variant.processor || product.processor;
}

export default function ProductBuyBox({ product }) {
  const variants = product.variants ?? [];
  const ramOptions = unique(variants.map((v) => v.ram)).sort((a, b) => a - b);
  const cpuOptionsAll = unique(variants.map((v) => cpuOf(v, product)));
  const showOptions = variants.length > 1;

  const firstAvailable = variants.find((v) => v.inStock) ?? variants[0];
  const [ram, setRam] = useState(firstAvailable?.ram ?? product.ram);
  const [ssd, setSsd] = useState(firstAvailable?.ssd ?? product.ssd);
  const [cpu, setCpu] = useState(firstAvailable ? cpuOf(firstAvailable, product) : product.processor);

  const ssdOptions = useMemo(
    () => unique(variants.filter((v) => v.ram === ram).map((v) => v.ssd)).sort((a, b) => a - b),
    [variants, ram],
  );

  const cpuOptions = useMemo(
    () => unique(variants.filter((v) => v.ram === ram && v.ssd === ssd).map((v) => cpuOf(v, product))),
    [variants, ram, ssd, product],
  );

  const selected =
    variants.find((v) => v.ram === ram && v.ssd === ssd && cpuOf(v, product) === cpu) ??
    variants.find((v) => v.ram === ram && v.ssd === ssd) ??
    variants.find((v) => v.ram === ram) ??
    firstAvailable;

  function pickRam(nextRam) {
    setRam(nextRam);
    const ssds = unique(variants.filter((v) => v.ram === nextRam).map((v) => v.ssd));
    const nextSsd = ssds.includes(ssd) ? ssd : ssds[0];
    setSsd(nextSsd);
    const cpus = unique(
      variants.filter((v) => v.ram === nextRam && v.ssd === nextSsd).map((v) => cpuOf(v, product)),
    );
    if (!cpus.includes(cpu)) setCpu(cpus[0]);
  }

  function pickSsd(nextSsd) {
    setSsd(nextSsd);
    const cpus = unique(
      variants.filter((v) => v.ram === ram && v.ssd === nextSsd).map((v) => cpuOf(v, product)),
    );
    if (!cpus.includes(cpu)) setCpu(cpus[0]);
  }

  if (!selected) {
    return <AddToCart product={product} />;
  }

  const outOfStock = !selected.inStock;
  const priceRange = product.priceMax && product.priceMax > product.price;

  return (
    <div>
      {showOptions && (
        <div className="space-y-4">
          {ramOptions.length > 1 && (
            <fieldset>
              <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">RAM</legend>
              <div className="flex flex-wrap gap-2">
                {ramOptions.map((option) => {
                  const anyInStock = variants.some((v) => v.ram === option && v.inStock);
                  return (
                    <Chip key={option} selected={ram === option} disabled={!anyInStock} onClick={() => pickRam(option)}>
                      {option}GB
                    </Chip>
                  );
                })}
              </div>
            </fieldset>
          )}
          {ssdOptions.length > 1 && (
            <fieldset>
              <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Storage</legend>
              <div className="flex flex-wrap gap-2">
                {ssdOptions.map((option) => {
                  const match = variants.find((v) => v.ram === ram && v.ssd === option);
                  return (
                    <Chip
                      key={option}
                      selected={ssd === option}
                      disabled={!match?.inStock}
                      onClick={() => pickSsd(option)}
                    >
                      {formatStorage(option)} SSD
                    </Chip>
                  );
                })}
              </div>
            </fieldset>
          )}
          {cpuOptionsAll.length > 1 && cpuOptions.length > 0 && (
            <fieldset>
              <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500">Processor</legend>
              <div className="flex flex-wrap gap-2">
                {cpuOptions.map((option) => {
                  const match = variants.find(
                    (v) => v.ram === ram && v.ssd === ssd && cpuOf(v, product) === option,
                  );
                  return (
                    <Chip
                      key={option}
                      selected={cpu === option}
                      disabled={!match?.inStock}
                      onClick={() => setCpu(option)}
                    >
                      {option}
                    </Chip>
                  );
                })}
              </div>
            </fieldset>
          )}
        </div>
      )}

      <p className={`flex items-center gap-2 text-xs font-semibold text-zinc-500 ${showOptions ? "mt-5" : "mt-0"}`}>
        <span className={product.condition === "Excellent" ? "text-brand-700" : "text-amber-600"}>
          {product.condition} condition
        </span>
        <span aria-hidden>·</span>
        <span>{outOfStock ? "Out of stock" : "In stock"}</span>
      </p>

      <p className="mt-3 text-3xl font-extrabold text-brand-950">{formatPrice(selected.price)}</p>
      {priceRange && showOptions && (
        <p className="mt-1 text-[11px] text-zinc-500">
          Other options from {formatPrice(product.price)}
          {product.priceMax > product.price ? ` to ${formatPrice(product.priceMax)}` : ""}.
        </p>
      )}
      <p className="mt-1 text-[11px] text-zinc-500">
        Inspected, tested and cleaned in our Sharjah workshop.
      </p>

      <div className="mt-6">
        <AddToCart product={product} variant={selected} />
      </div>
    </div>
  );
}
