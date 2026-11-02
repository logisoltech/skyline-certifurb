"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { createUserAction, updateUserAction } from "../../cms/actions/users";
import { ROLE_IDS, ROLES } from "../../lib/cms/constants";
import { useCmsAction } from "./hooks";
import { Badge, Card, Field, Notice, btnDanger, btnPrimary, btnSecondary, controlClass, formatDate, inputClass } from "./ui";

const STATUS_TONE = { active: "green", pending: "amber", disabled: "red" };

function CreateUserForm() {
  const router = useRouter();
  const [state, onSubmit, pending] = useCmsAction(createUserAction);
  const errors = state?.fieldErrors ?? {};

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <Card title="Add a CMS user" description="They can sign in immediately with the password you set. Tell them to change it.">
      <form onSubmit={onSubmit} noValidate className="grid gap-4 sm:grid-cols-2">
        {state?.ok && <Notice tone="success" className="sm:col-span-2">{state.message}</Notice>}
        {state?.error && <Notice tone="error" className="sm:col-span-2">{state.error}</Notice>}
        <Field label="Full name" htmlFor="nu-name" error={errors.name}>
          <input id="nu-name" name="name" required className={inputClass} />
        </Field>
        <Field label="Email" htmlFor="nu-email" error={errors.email}>
          <input id="nu-email" name="email" type="email" required className={inputClass} />
        </Field>
        <Field label="Role" htmlFor="nu-role" error={errors.role}>
          <select id="nu-role" name="role" defaultValue="editor" className={inputClass}>
            {ROLE_IDS.map((id) => (
              <option key={id} value={id}>{ROLES[id].label}</option>
            ))}
          </select>
        </Field>
        <Field label="Temporary password" htmlFor="nu-password" error={errors.password} hint="At least 10 characters, with a letter and a number.">
          <input id="nu-password" name="password" type="password" autoComplete="new-password" required className={inputClass} />
        </Field>
        <div className="sm:col-span-2">
          <button type="submit" disabled={pending} className={btnPrimary}>
            {pending ? "Adding…" : "Add user"}
          </button>
        </div>
      </form>
    </Card>
  );
}

function UserRow({ user, currentId }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [approveRole, setApproveRole] = useState("editor");
  const [error, setError] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const isSelf = user.id === currentId;

  function run(change, okText) {
    setError(null);
    start(async () => {
      const result = await updateUserAction(user.id, change);
      if (result.ok) {
        setConfirmDelete(false);
        router.refresh();
      } else {
        setError(result.error ?? okText);
      }
    });
  }

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-bold text-zinc-900">
            {user.name}
            {isSelf && <span className="ml-2 text-[11px] font-semibold text-zinc-500">(you)</span>}
          </p>
          <p className="text-[11px] text-zinc-500">{user.email}</p>
          <p className="mt-1 flex flex-wrap items-center gap-2">
            <Badge tone={STATUS_TONE[user.status]}>{user.status}</Badge>
            <span className="text-[11px] text-zinc-500">
              {ROLES[user.role]?.label} · joined {formatDate(user.createdAt)}
              {user.lastLoginAt ? ` · last in ${formatDate(user.lastLoginAt)}` : ""}
            </span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user.status === "pending" && (
            <>
              <select
                value={approveRole}
                onChange={(e) => setApproveRole(e.target.value)}
                className={`${controlClass} h-9`}
                aria-label={`Role for ${user.name}`}
              >
                {ROLE_IDS.map((id) => (
                  <option key={id} value={id}>{ROLES[id].label}</option>
                ))}
              </select>
              <button
                type="button"
                disabled={pending}
                onClick={() => run({ action: "approve", role: approveRole })}
                className={btnPrimary}
              >
                Approve
              </button>
            </>
          )}

          {user.status !== "pending" && !isSelf && (
            <select
              value={user.role}
              disabled={pending}
              onChange={(e) => run({ action: "role", role: e.target.value })}
              aria-label={`Change role for ${user.name}`}
              className={`${controlClass} h-9`}
            >
              {ROLE_IDS.map((id) => (
                <option key={id} value={id}>{ROLES[id].label}</option>
              ))}
            </select>
          )}

          {user.status === "active" && !isSelf && (
            <button type="button" disabled={pending} onClick={() => run({ action: "disable" })} className={btnSecondary}>
              Disable
            </button>
          )}
          {user.status === "disabled" && (
            <button type="button" disabled={pending} onClick={() => run({ action: "enable" })} className={btnSecondary}>
              Enable
            </button>
          )}

          {!isSelf && (
            confirmDelete ? (
              <span className="flex items-center gap-2">
                <button type="button" disabled={pending} onClick={() => run({ action: "delete" })} className={btnDanger}>
                  Confirm delete
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className={btnSecondary}>
                  Keep
                </button>
              </span>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className={btnDanger}>
                Delete
              </button>
            )
          )}
        </div>
      </div>
      {error && <p role="alert" className="mt-2 text-xs font-medium text-red-600">{error}</p>}
    </li>
  );
}

export default function UsersManager({ users, currentId }) {
  const pending = users.filter((u) => u.status === "pending");
  const rest = users.filter((u) => u.status !== "pending");

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <Card title="Access requests" description="People who signed up and are waiting for an owner to approve them." padded={false}>
          <ul className="divide-y divide-zinc-100">
            {pending.map((u) => (
              <UserRow key={u.id} user={u} currentId={currentId} />
            ))}
          </ul>
        </Card>
      )}

      <Card title="Team" padded={false}>
        <ul className="divide-y divide-zinc-100">
          {rest.map((u) => (
            <UserRow key={u.id} user={u} currentId={currentId} />
          ))}
        </ul>
      </Card>

      <CreateUserForm />

      <Card title="Roles">
        <ul className="space-y-3 text-sm">
          {ROLE_IDS.map((id) => (
            <li key={id}>
              <p className="font-bold text-zinc-900">{ROLES[id].label}</p>
              <p className="text-xs text-zinc-500">{ROLES[id].description}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}
