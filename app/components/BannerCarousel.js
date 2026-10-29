"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "./Icons";

const SLIDES = [
  {
    src: "/laptop-banner-2.png",
    alt: "Renewed laptops – get yours now",
  },
  {
    src: "/main-1.png",
    alt: "Certifurb Certified Refurbished – Lenovo ThinkPad T490",
  },
  {
    src: "/main-2.png",
    alt: "Certifurb Certified Refurbished – Acer Chromebook Plus",
  },
];

const INTERVAL_MS = 5000;

export default function BannerCarousel() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = SLIDES.length;

  const go = useCallback(
    (next) => setIndex((next + count) % count),
    [count],
  );

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % count), INTERVAL_MS);
    return () => clearInterval(id);
  }, [paused, count]);

  return (
    <div
      role="group"
      aria-roledescription="carousel"
      aria-label="Featured laptops"
      className="group relative overflow-hidden rounded-3xl border border-brand-100 bg-white shadow-[0_20px_60px_-20px_rgba(22,101,52,0.35)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
    >
      <div className="relative aspect-1440/470 w-full overflow-hidden bg-brand-950">
        <div
          className="flex h-full transition-transform duration-700 ease-out motion-reduce:transition-none"
          style={{ transform: `translateX(-${index * 100}%)` }}
        >
          {SLIDES.map((slide, i) => (
            <div
              key={slide.src}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
              aria-hidden={i !== index}
              className="relative h-full w-full shrink-0"
            >
              <Image
                src={slide.src}
                alt={slide.alt}
                fill
                sizes="(min-width: 1280px) 760px, (min-width: 1024px) 60vw, 100vw"
                className="object-cover"
                loading="eager"
                fetchPriority={i === 0 ? "high" : "auto"}
                draggable={false}
              />
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() => go(index - 1)}
          aria-label="Previous slide"
          className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-brand-900 opacity-0 shadow transition hover:bg-white focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-brand-600 group-hover:opacity-100"
        >
          <ChevronLeftIcon width={18} height={18} />
        </button>
        <button
          type="button"
          onClick={() => go(index + 1)}
          aria-label="Next slide"
          className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-brand-900 opacity-0 shadow transition hover:bg-white focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-brand-600 group-hover:opacity-100"
        >
          <ChevronRightIcon width={18} height={18} />
        </button>
      </div>

      {/* Footer strip: inspection badge + dots */}
      <div className="flex items-center justify-between gap-4 bg-white px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
            <span className="h-2 w-2 rounded-full bg-brand-600" />
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-foreground">
              Professionally inspected
            </p>
            <p className="text-xs text-zinc-500">
              Tested before dispatch in the UAE
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2" role="tablist" aria-label="Choose slide">
          {SLIDES.map((slide, i) => (
            <button
              key={slide.src}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index
                  ? "w-6 bg-brand-600"
                  : "w-2 bg-brand-200 hover:bg-brand-300"
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
