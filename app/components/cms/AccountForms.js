"use client";

import { changeOwnPasswordAction, updateOwnProfileAction } from "../../cms/actions/auth";
import { ROLES } from "../../lib/cms/constants";
import { useCmsAction } from "./hooks";
import { Card, Field, Notice, btnPrimary, formatDateTime, inputClass } from "./ui";

export default function AccountForms({ user }) {
  const [profile, onProfile, profilePending] = useCmsAction(updateOwnProfileAction);
  const [password, onPassword, passwordPending] = useCmsAction(changeOwnPasswordAction);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card title="Your details">
        <form onSubmit={onProfile} noValidate className="space-y-4">
          {profile?.ok && <Notice tone="success">{profile.message}</Notice>}
          {profile?.error && <Notice tone="error">{profile.error}</Notice>}
          <Field label="Full name" htmlFor="me-name" error={profile?.fieldErrors?.name}>
            <input id="me-name" name="name" defaultValue={user.name} required className={inputClass} />
          </Field>
          <Field label="Email" htmlFor="me-email" hint="Email can't be changed here. Ask another owner if you need a new address.">
            <input id="me-email" value={user.email} disabled className={inputClass} />
          </Field>
          <p className="text-xs text-zinc-500">
            Role: {ROLES[user.role]?.label}
            {user.lastLoginAt ? ` · Last signed in ${formatDateTime(user.lastLoginAt)}` : ""}
          </p>
          <button type="submit" disabled={profilePending} className={btnPrimary}>
            {profilePending ? "Saving…" : "Save name"}
          </button>
        </form>
      </Card>

      <Card title="Password" description="Changing it signs you out of other devices.">
        <form onSubmit={onPassword} noValidate className="space-y-4">
          {password?.ok && <Notice tone="success">{password.message}</Notice>}
          {password?.error && <Notice tone="error">{password.error}</Notice>}
          <Field label="Current password" htmlFor="pw-current" error={password?.fieldErrors?.current}>
            <input id="pw-current" name="current" type="password" autoComplete="current-password" required className={inputClass} />
          </Field>
          <Field label="New password" htmlFor="pw-next" error={password?.fieldErrors?.next} hint="At least 10 characters, with a letter and a number.">
            <input id="pw-next" name="next" type="password" autoComplete="new-password" required className={inputClass} />
          </Field>
          <Field label="Confirm new password" htmlFor="pw-confirm" error={password?.fieldErrors?.confirm}>
            <input id="pw-confirm" name="confirm" type="password" autoComplete="new-password" required className={inputClass} />
          </Field>
          <button type="submit" disabled={passwordPending} className={btnPrimary}>
            {passwordPending ? "Updating…" : "Update password"}
          </button>
        </form>
      </Card>
    </div>
  );
}
