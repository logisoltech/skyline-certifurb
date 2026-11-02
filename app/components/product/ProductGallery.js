"use client";

import Image from "next/image";
import { useState } from "react";

export default function ProductGallery({ images, title, outOfStock }) {
  const photos = images?.length ? images : [];
  const [active, setActive] = useState(0);
  const current = photos[Math.min(active, Math.max(photos.length - 1, 0))] ?? photos[0];

  if (!current) return null;

  return (
    <div>
      <div className="relative aspect-4/3 overflow-hidden rounded-3xl border border-zinc-200 bg-linear-to-b from-brand-50/70 to-white">
        <Image
          src={current}
          alt={title}
          fill
          preload={active === 0}
          sizes="(min-width: 1024px) 560px, 100vw"
          className={`object-contain p-6 ${outOfStock ? "opacity-60 grayscale-30" : ""}`}
        />
      </div>
      {photos.length > 1 && (
        <ul className="mt-3 flex flex-wrap gap-2">
          {photos.map((src, index) => (
            <li key={`${src}-${index}`}>
              <button
                type="button"
                onClick={() => setActive(index)}
                aria-label={`Photo ${index + 1}`}
                aria-current={index === active ? "true" : undefined}
                className={`relative h-16 w-20 overflow-hidden rounded-xl border bg-white ${
                  index === active ? "border-brand-600 ring-2 ring-brand-100" : "border-zinc-200 hover:border-brand-300"
                }`}
              >
                <Image src={src} alt="" fill sizes="80px" className="object-contain p-1" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
