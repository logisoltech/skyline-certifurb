"use client";

import { useState } from "react";
import {
  changePassword,
  deleteAccount,
  savePrefs,
  updateProfile,
  useAccount,
} from "../../lib/auth";
import {
  Alert,
  PasswordField,
  TextField,
  Toggle,
  primaryButtonClass,
} from "../forms";
import { useLeaveAccount } from "./AccountShell";
import { PageHeading } from "./OrderParts";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function Card({ title, description, children }) {
  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-6">
      <h2 className="text-sm font-extrabold text-brand-950">{title}</h2>
      {description && <p className="mt-1 text-xs text-zinc-500">{description}</p>}
      <div className="mt-5">{children}</div>
    </section>
  );
}

function ProfileForm({ user }) {
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null); // { tone, text }
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const values = {
      name: String(form.get("name") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      phone: String(form.get("phone") ?? "").trim(),
    };

    const found = {};
    if (values.name.length < 2) found.name = "Enter your full name.";
    if (!EMAIL_PATTERN.test(values.email)) found.email = "Enter a valid email address.";
    if (values.phone && values.phone.replace(/\D/g, "").length < 8) {
      found.phone = "Enter a valid phone number, or leave it blank.";
    }
    setErrors(found);
    setMessage(null);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    const result = await updateProfile(values);
    setBusy(false);
    setMessage(
      result.ok
        ? { tone: "success", text: "Your details have been updated." }
        : { tone: "error", text: result.error },
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      onInput={(e) =>
        setErrors((prev) => (prev[e.target.name] ? { ...prev, [e.target.name]: undefined } : prev))
      }
      noValidate
      className="space-y-4"
    >
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="Full name"
          name="name"
          autoComplete="name"
          defaultValue={user.name}
          error={errors.name}
          className="sm:col-span-2"
        />
        <TextField
          label="Email address"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={user.email}
          error={errors.email}
        />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          defaultValue={user.phone}
          placeholder="+971 50 123 4567"
          error={errors.phone}
        />
      </div>
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const form = new FormData(formEl);
    const current = String(form.get("current") ?? "");
    const next = String(form.get("next") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    const found = {};
    if (!current) found.current = "Enter your current password.";
    if (next.length < 8) found.next = "Use at least 8 characters.";
    else if (!/[A-Za-z]/.test(next) || !/\d/.test(next)) {
      found.next = "Include at least one letter and one number.";
    }
    if (confirm !== next) found.confirm = "Passwords don't match.";
    setErrors(found);
    setMessage(null);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    const result = await changePassword(current, next);
    setBusy(false);
    if (result.ok) {
      formEl.reset();
      setMessage({ tone: "success", text: "Password updated." });
    } else {
      setErrors({ current: result.error });
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      onInput={(e) =>
        setErrors((prev) => (prev[e.target.name] ? { ...prev, [e.target.name]: undefined } : prev))
      }
      noValidate
      className="space-y-4"
    >
      {message && <Alert tone={message.tone}>{message.text}</Alert>}
      <PasswordField
        label="Current password"
        name="current"
        autoComplete="current-password"
        error={errors.current}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField
          label="New password"
          name="next"
          autoComplete="new-password"
          hint="At least 8 characters, with a letter and a number."
          error={errors.next}
        />
        <PasswordField
          label="Confirm new password"
          name="confirm"
          autoComplete="new-password"
          error={errors.confirm}
        />
      </div>
      <button type="submit" disabled={busy} className={primaryButtonClass}>
        {busy ? "Updating…" : "Update password"}
      </button>
    </form>
  );
}

export default function Settings() {
  const { user, data } = useAccount();
  const leave = useLeaveAccount();
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  if (!user) return null;

  function handleDelete() {
    leave(deleteAccount);
  }

  const { prefs } = data;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Settings"
        description="Manage your personal details, password and notifications."
      />

      <Card title="Personal details" description="This is the name and contact info on your orders.">
        <ProfileForm user={user} />
      </Card>

      <Card title="Password" description="Choose a strong password you don't use anywhere else.">
        <PasswordForm />
      </Card>

      <Card title="Notifications" description="Choose how we keep you in the loop. Changes save automatically.">
        <div className="divide-y divide-zinc-100">
          <Toggle
            label="Order updates by email"
            description="Confirmations, dispatch and delivery notices."
            checked={prefs.orderEmails}
            onChange={(v) => savePrefs({ orderEmails: v })}
          />
          <Toggle
            label="WhatsApp delivery updates"
            description="Quick messages from our team about your delivery."
            checked={prefs.whatsappUpdates}
            onChange={(v) => savePrefs({ whatsappUpdates: v })}
          />
          <Toggle
            label="New arrivals & offers"
            description="Fresh stock and useful deals. No noise."
            checked={prefs.offers}
            onChange={(v) => savePrefs({ offers: v })}
          />
        </div>
      </Card>

      <section className="rounded-3xl border border-red-200 bg-red-50/40 p-6">
        <h2 className="text-sm font-extrabold text-red-700">Delete account</h2>
        <p className="mt-1 max-w-xl text-xs leading-relaxed text-zinc-600">
          This permanently removes your profile, wishlist and saved addresses.
          This can't be undone.
        </p>
        {confirmingDelete ? (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className="text-xs font-bold text-zinc-800">Are you sure?</span>
            <button
              type="button"
              onClick={handleDelete}
              className="inline-flex h-10 items-center rounded-full bg-red-600 px-5 text-xs font-bold text-white transition hover:bg-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              Yes, delete my account
            </button>
            <button
              type="button"
              onClick={() => setConfirmingDelete(false)}
              className="inline-flex h-10 items-center rounded-full border border-zinc-300 bg-white px-5 text-xs font-bold text-zinc-700 transition hover:border-zinc-500"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmingDelete(true)}
            className="mt-4 inline-flex h-10 items-center rounded-full border border-red-300 bg-white px-5 text-xs font-bold text-red-600 transition hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
          >
            Delete my account
          </button>
        )}
      </section>
    </div>
  );
}
