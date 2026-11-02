"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { safeNext, signUp, useAccount } from "../../lib/auth";
import {
  Alert,
  PasswordField,
  TextField,
  primaryButtonClass,
} from "../forms";
import AuthShell from "./AuthShell";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function passwordScore(password) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) && /[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

const STRENGTH = [
  { label: "Too short", bar: "bg-red-400" },
  { label: "Weak", bar: "bg-red-400" },
  { label: "Okay", bar: "bg-amber-400" },
  { label: "Good", bar: "bg-brand-500" },
  { label: "Strong", bar: "bg-brand-600" },
];

function validate(values) {
  const errors = {};
  if (values.name.trim().length < 2) errors.name = "Enter your full name.";
  if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }
  if (values.phone && values.phone.replace(/\D/g, "").length < 8) {
    errors.phone = "Enter a valid phone number, or leave it blank.";
  }
  if (values.password.length < 8) {
    errors.password = "Use at least 8 characters.";
  } else if (!/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) {
    errors.password = "Include at least one letter and one number.";
  }
  if (values.confirm !== values.password) {
    errors.confirm = "Passwords don't match.";
  }
  if (!values.terms) {
    errors.terms = "Please accept the terms to continue.";
  }
  return errors;
}

export default function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get("next"));
  const { status } = useAccount();

  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (status === "authenticated") router.replace(next);
  }, [status, next, router]);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      name: String(form.get("name") ?? ""),
      email: String(form.get("email") ?? ""),
      phone: String(form.get("phone") ?? ""),
      password: String(form.get("password") ?? ""),
      confirm: String(form.get("confirm") ?? ""),
      terms: form.get("terms") === "on",
      offers: form.get("offers") === "on",
    };

    const found = validate(values);
    setErrors(found);
    setFormError("");
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    const result = await signUp(values);
    if (!result.ok) {
      setFormError(result.error);
      setBusy(false);
    }
  }

  const query = next === "/account" ? "" : `?next=${encodeURIComponent(next)}`;
  const score = password ? passwordScore(password) : -1;

  return (
    <AuthShell
      title="Create your account"
      subtitle="It takes less than a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link
            href={`/login${query}`}
            className="font-bold text-brand-700 hover:text-brand-900 hover:underline"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form
        onSubmit={handleSubmit}
        onInput={(e) => {
          const { name } = e.target;
          if (name === "password") setPassword(e.target.value);
          setErrors((prev) => (prev[name] ? { ...prev, [name]: undefined } : prev));
        }}
        noValidate
        className="space-y-5"
      >
        {formError && <Alert>{formError}</Alert>}

        <TextField
          label="Full name"
          name="name"
          autoComplete="name"
          placeholder="Your full name"
          error={errors.name}
        />
        <TextField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={errors.email}
        />
        <TextField
          label="Phone (optional)"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+971 50 123 4567"
          hint="For delivery updates. We'll never share it."
          error={errors.phone}
        />

        <div>
          <PasswordField
            label="Password"
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            error={errors.password}
          />
          {score >= 0 && (
            <div className="mt-2" aria-live="polite">
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((i) => (
                  <span
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i <= score ? STRENGTH[score].bar : "bg-zinc-200"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-[11px] text-zinc-500">
                Strength: {STRENGTH[score].label}
              </p>
            </div>
          )}
        </div>

        <PasswordField
          label="Confirm password"
          name="confirm"
          autoComplete="new-password"
          placeholder="Re-enter your password"
          error={errors.confirm}
        />

        <div className="space-y-3">
          <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-zinc-600">
            <input
              type="checkbox"
              name="terms"
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
              aria-invalid={errors.terms ? true : undefined}
            />
            <span>
              I agree to the{" "}
              <Link href="/terms" className="font-bold text-brand-700 hover:underline">
                Terms of service
              </Link>{" "}
              and{" "}
              <Link href="/privacy-policy" className="font-bold text-brand-700 hover:underline">
                Privacy policy
              </Link>
              .
            </span>
          </label>
          {errors.terms && (
            <p className="text-[11px] font-medium text-red-600">{errors.terms}</p>
          )}
          <label className="flex cursor-pointer items-start gap-2.5 text-xs leading-relaxed text-zinc-600">
            <input
              type="checkbox"
              name="offers"
              className="mt-0.5 h-4 w-4 shrink-0 accent-brand-600"
            />
            <span>Email me new arrivals and offers (optional).</span>
          </label>
        </div>

        <button type="submit" disabled={busy} className={`${primaryButtonClass} w-full`}>
          {busy ? "Creating account…" : "Create account"}
        </button>
      </form>
    </AuthShell>
  );
}
