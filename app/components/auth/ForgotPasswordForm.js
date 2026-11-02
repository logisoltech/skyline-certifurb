"use client";

import Link from "next/link";
import { useState } from "react";
import { Alert, TextField, primaryButtonClass } from "../forms";
import AuthShell from "./AuthShell";

export default function ForgotPasswordForm() {
  const [sentTo, setSentTo] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const email = String(new FormData(event.currentTarget).get("email") ?? "").trim();
    // TODO: call your password-reset endpoint here. We always show the same
    // message so the form never reveals which emails have accounts.
    setSentTo(email);
  }

  return (
    <AuthShell
      title="Reset your password"
      subtitle="Enter your email and we'll send you a link to choose a new one."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/login" className="font-bold text-brand-700 hover:underline">
            Back to sign in
          </Link>
        </>
      }
    >
      {sentTo ? (
        <Alert tone="success">
          If an account exists for <strong>{sentTo}</strong>, a reset link is on
          its way. It can take a few minutes to arrive, so check your spam
          folder too.
        </Alert>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <TextField
            label="Email address"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            required
          />
          <button type="submit" className={`${primaryButtonClass} w-full`}>
            Send reset link
          </button>
        </form>
      )}
    </AuthShell>
  );
}
