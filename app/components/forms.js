"use client";

import { useId, useState } from "react";
import { EyeIcon, EyeOffIcon } from "./Icons";

export const inputClass =
  "h-11 w-full rounded-xl border border-zinc-300 bg-white px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-brand-600 focus:ring-3 focus:ring-brand-600/15 disabled:bg-zinc-50 disabled:text-zinc-500 aria-invalid:border-red-500";

export const primaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-full bg-brand-950 px-6 text-xs font-bold text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
  "inline-flex h-11 items-center justify-center rounded-full border border-brand-200 bg-white px-6 text-xs font-bold text-brand-950 transition hover:border-brand-600 hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 disabled:cursor-not-allowed disabled:opacity-60";

export function Alert({ tone = "error", children }) {
  const styles =
    tone === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-brand-200 bg-brand-50 text-brand-900";
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-xl border px-4 py-3 text-xs font-medium leading-relaxed ${styles}`}
    >
      {children}
    </div>
  );
}

export function TextField({ label, error, hint, className = "", ...props }) {
  const id = useId();
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-zinc-800">
        {label}
      </label>
      <input
        id={id}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        {...props}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[11px] text-zinc-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[11px] font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function PasswordField({ label, error, hint, className = "", ...props }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const describedBy = [error && `${id}-error`, hint && `${id}-hint`]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-zinc-800">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={visible ? "text" : "password"}
          className={`${inputClass} pr-12`}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          {...props}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          aria-pressed={visible}
          className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-zinc-500 transition hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-brand-600"
        >
          {visible ? (
            <EyeOffIcon width={18} height={18} />
          ) : (
            <EyeIcon width={18} height={18} />
          )}
        </button>
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[11px] text-zinc-500">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="mt-1.5 text-[11px] font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

export function SelectField({ label, error, children, className = "", ...props }) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-bold text-zinc-800">
        {label}
      </label>
      <select
        id={id}
        className={inputClass}
        aria-invalid={error ? true : undefined}
        {...props}
      >
        {children}
      </select>
      {error && (
        <p className="mt-1.5 text-[11px] font-medium text-red-600">{error}</p>
      )}
    </div>
  );
}

export function Toggle({ label, description, checked, onChange }) {
  const id = useId();
  return (
    <div className="flex items-start justify-between gap-4 py-3">
      <label htmlFor={id} className="cursor-pointer">
        <span className="block text-[13px] font-bold text-zinc-800">{label}</span>
        {description && (
          <span className="mt-0.5 block text-xs text-zinc-500">{description}</span>
        )}
      </label>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 ${
          checked ? "bg-brand-600" : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : ""
          }`}
        />
      </button>
    </div>
  );
}
