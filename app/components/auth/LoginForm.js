"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { DEMO_ACCOUNT, safeNext, signIn, useAccount } from "../../lib/auth";
import {
  Alert,
  PasswordField,
  TextField,
  primaryButtonClass,
  secondaryButtonClass,
} from "../forms";
import AuthShell from "./AuthShell";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { status } = useAccount();

  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  // Already signed in (or just signed in): go where they were headed.
  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  async function attempt(email, password) {
    setError("");
    setBusy(true);
    const result = await signIn(email, password);
    if (!result.ok) {
      setError(result.error);
      setBusy(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    attempt(form.get("email"), form.get("password"));
  }

  const query = next === "/account" ? "" : `?next=${encodeURIComponent(next)}`;

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to track orders, manage your wishlist and more."
      footer={
        <>
          New to Certifurb?{" "}
          <Link
            href={`/signup${query}`}
            className="font-bold text-brand-700 hover:text-brand-900 hover:underline"
          >
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        {error && <Alert>{error}</Alert>}

        <TextField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
        />

        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            required
          />
          <div className="mt-2 text-right">
            <Link
              href="/forgot-password"
              className="text-[11px] font-bold text-brand-700 hover:text-brand-900 hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </div>

        <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full`}>
          {busy ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-brand-50/60 p-4">
        <p className="text-xs font-bold text-brand-950">Just exploring?</p>
        <p className="mt-1 text-[11px] leading-relaxed text-zinc-600">
          Try the demo account to see order history, tracking and wishlist with
          sample data.
        </p>
        <button
          type="button"
          disabled={busy}
          onClick={() => attempt(DEMO_ACCOUNT.email, DEMO_ACCOUNT.password)}
          className={`${secondaryButtonClass} mt-3 h-9 w-full`}
        >
          Sign in as demo user
        </button>
      </div>
    </AuthShell>
  );
}
