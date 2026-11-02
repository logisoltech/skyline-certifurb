"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { loginAction, signupAction } from "../../cms/actions/auth";
import { useCmsAction } from "./hooks";
import { Field, Notice, btnPrimary, inputClass } from "./ui";

function PasswordInput({ id, name, autoComplete, invalid }) {
  const [shown, setShown] = useState(false);
  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={shown ? "text" : "password"}
        autoComplete={autoComplete}
        aria-invalid={invalid || undefined}
        required
        className={`${inputClass} pr-16`}
      />
      <button
        type="button"
        onClick={() => setShown((s) => !s)}
        aria-pressed={shown}
        className="absolute inset-y-0 right-0 px-3 text-[11px] font-bold text-brand-700 hover:text-brand-900"
      >
        {shown ? "Hide" : "Show"}
      </button>
    </div>
  );
}

export function LoginForm({ noUsersYet }) {
  const [state, onSubmit, pending] = useCmsAction(loginAction);
  const next = useSearchParams().get("next") ?? "";

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">Sign in to the CMS</h2>
      <p className="mt-1 text-sm text-zinc-500">Use your staff account.</p>

      {noUsersYet && (
        <div className="mt-5">
          <Notice tone="info">
            No accounts exist yet.{" "}
            <Link href="/cms/signup" className="font-bold underline">
              Create the owner account
            </Link>{" "}
            to get started.
          </Notice>
        </div>
      )}

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        <input type="hidden" name="next" value={next} />
        {state?.error && <Notice tone="error">{state.error}</Notice>}
        <Field label="Email address" htmlFor="login-email">
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="username"
            required
            className={inputClass}
          />
        </Field>
        <Field label="Password" htmlFor="login-password">
          <PasswordInput id="login-password" name="password" autoComplete="current-password" />
        </Field>
        <button type="submit" disabled={pending} className={`${btnPrimary} h-11 w-full`}>
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-zinc-500">
        Need access?{" "}
        <Link href="/cms/signup" className="font-bold text-brand-700 hover:underline">
          Request an account
        </Link>
      </p>
    </div>
  );
}

export function SignupForm({ firstRun }) {
  const [state, onSubmit, pending] = useCmsAction(signupAction);
  const errors = state?.fieldErrors ?? {};

  if (state?.pending) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">Request sent</h2>
        <div className="mt-5">
          <Notice tone="success">{state.message}</Notice>
        </div>
        <Link href="/cms/login" className={`${btnPrimary} mt-6 h-11 w-full`}>
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm">
      <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
        {firstRun ? "Create the owner account" : "Request CMS access"}
      </h2>
      <p className="mt-1 text-sm text-zinc-500">
        {firstRun
          ? "You're the first one here, so this account becomes the Owner with full access."
          : "An owner has to approve your request before you can sign in."}
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
        {state?.error && <Notice tone="error">{state.error}</Notice>}
        <Field label="Full name" htmlFor="su-name" error={errors.name}>
          <input
            id="su-name"
            name="name"
            autoComplete="name"
            required
            aria-invalid={errors.name ? true : undefined}
            className={inputClass}
          />
        </Field>
        <Field label="Work email" htmlFor="su-email" error={errors.email}>
          <input
            id="su-email"
            name="email"
            type="email"
            autoComplete="email"
            required
            aria-invalid={errors.email ? true : undefined}
            className={inputClass}
          />
        </Field>
        <Field
          label="Password"
          htmlFor="su-password"
          error={errors.password}
          hint="At least 10 characters, with a letter and a number."
        >
          <PasswordInput id="su-password" name="password" autoComplete="new-password" invalid={!!errors.password} />
        </Field>
        <Field label="Confirm password" htmlFor="su-confirm" error={errors.confirm}>
          <PasswordInput id="su-confirm" name="confirm" autoComplete="new-password" invalid={!!errors.confirm} />
        </Field>
        <button type="submit" disabled={pending} className={`${btnPrimary} h-11 w-full`}>
          {pending ? "Creating…" : firstRun ? "Create owner account" : "Request access"}
        </button>
      </form>

      <p className="mt-6 text-center text-xs text-zinc-500">
        Already have an account?{" "}
        <Link href="/cms/login" className="font-bold text-brand-700 hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
