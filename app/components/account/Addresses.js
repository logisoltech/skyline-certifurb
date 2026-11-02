"use client";

import { useState } from "react";
import {
  deleteAddress,
  saveAddress,
  setDefaultAddress,
  useAccount,
} from "../../lib/auth";
import {
  SelectField,
  TextField,
  primaryButtonClass,
  secondaryButtonClass,
} from "../forms";
import { EmptyState, PageHeading } from "./OrderParts";

const EMIRATES = [
  "Abu Dhabi",
  "Dubai",
  "Sharjah",
  "Ajman",
  "Umm Al Quwain",
  "Ras Al Khaimah",
  "Fujairah",
];

function AddressForm({ initial, onDone }) {
  const [errors, setErrors] = useState({});
  const editing = Boolean(initial?.id);

  function handleSubmit(event) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const value = (key) => String(form.get(key) ?? "").trim();

    const address = {
      id: initial?.id,
      label: value("label") || "Home",
      name: value("name"),
      phone: value("phone"),
      emirate: value("emirate"),
      area: value("area"),
      line: value("line"),
      isDefault: form.get("isDefault") === "on" || Boolean(initial?.isDefault),
    };

    const found = {};
    if (!address.name) found.name = "Enter the recipient's name.";
    if (address.phone.replace(/\D/g, "").length < 8) found.phone = "Enter a valid phone number.";
    if (!address.area) found.area = "Enter your area or neighbourhood.";
    if (!address.line) found.line = "Enter building, street and apartment details.";
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    saveAddress(address);
    onDone();
  }

  const clear = (e) =>
    setErrors((prev) => (prev[e.target.name] ? { ...prev, [e.target.name]: undefined } : prev));

  return (
    <form
      onSubmit={handleSubmit}
      onInput={clear}
      noValidate
      aria-label={editing ? "Edit address" : "Add a new address"}
      className="rounded-3xl border border-brand-200 bg-brand-50/40 p-5 sm:p-6"
    >
      <h2 className="text-sm font-extrabold text-brand-950">
        {editing ? "Edit address" : "Add a new address"}
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <SelectField label="Label" name="label" defaultValue={initial?.label ?? "Home"}>
          <option>Home</option>
          <option>Work</option>
          <option>Other</option>
        </SelectField>
        <TextField
          label="Recipient name"
          name="name"
          autoComplete="name"
          defaultValue={initial?.name}
          error={errors.name}
        />
        <TextField
          label="Phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          placeholder="+971 50 123 4567"
          defaultValue={initial?.phone}
          error={errors.phone}
        />
        <SelectField label="Emirate" name="emirate" defaultValue={initial?.emirate ?? "Sharjah"}>
          {EMIRATES.map((e) => (
            <option key={e}>{e}</option>
          ))}
        </SelectField>
        <TextField
          label="Area / neighbourhood"
          name="area"
          defaultValue={initial?.area}
          error={errors.area}
          className="sm:col-span-2"
        />
        <TextField
          label="Building, street & apartment"
          name="line"
          autoComplete="street-address"
          defaultValue={initial?.line}
          error={errors.line}
          className="sm:col-span-2"
        />
      </div>

      {!initial?.isDefault && (
        <label className="mt-4 flex cursor-pointer items-center gap-2.5 text-xs text-zinc-700">
          <input type="checkbox" name="isDefault" className="h-4 w-4 accent-brand-600" />
          Make this my default address
        </label>
      )}

      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" className={primaryButtonClass}>
          {editing ? "Save changes" : "Save address"}
        </button>
        <button type="button" onClick={onDone} className={secondaryButtonClass}>
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function Addresses() {
  const { user, data } = useAccount();
  // null = closed, {} = adding, {…address} = editing
  const [editing, setEditing] = useState(null);
  const [confirmId, setConfirmId] = useState(null);
  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeading
        title="Addresses"
        description="Where should we deliver your laptop?"
      >
        {editing === null && (
          <button type="button" onClick={() => setEditing({})} className={`${primaryButtonClass} h-10`}>
            Add new address
          </button>
        )}
      </PageHeading>

      {editing !== null && (
        // key resets the form when switching between add / different edits
        <AddressForm
          key={editing.id ?? "new"}
          initial={editing.id ? editing : null}
          onDone={() => setEditing(null)}
        />
      )}

      {data.addresses.length === 0 && editing === null ? (
        <EmptyState
          title="No saved addresses"
          text="Add an address to make checkout faster."
          action={
            <button type="button" onClick={() => setEditing({})} className={primaryButtonClass}>
              Add an address
            </button>
          }
        />
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {data.addresses.map((address) => (
            <li key={address.id}>
              <article
                className={`flex h-full flex-col rounded-3xl border bg-white p-5 ${
                  address.isDefault ? "border-brand-400" : "border-zinc-200"
                }`}
              >
                <header className="flex items-center justify-between gap-2">
                  <h2 className="text-sm font-extrabold text-brand-950">{address.label}</h2>
                  {address.isDefault && (
                    <span className="rounded-full bg-brand-100 px-2.5 py-1 text-[10px] font-bold text-brand-800">
                      Default
                    </span>
                  )}
                </header>
                <address className="mt-3 flex-1 text-xs not-italic leading-relaxed text-zinc-600">
                  <span className="font-bold text-zinc-800">{address.name}</span>
                  <br />
                  {address.line}, {address.area}
                  <br />
                  {address.emirate}, UAE
                  <br />
                  {address.phone}
                </address>

                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-zinc-100 pt-4 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setEditing(address)}
                    className="text-brand-700 hover:underline"
                  >
                    Edit
                  </button>
                  {!address.isDefault && (
                    <button
                      type="button"
                      onClick={() => setDefaultAddress(address.id)}
                      className="text-brand-700 hover:underline"
                    >
                      Set as default
                    </button>
                  )}
                  {confirmId === address.id ? (
                    <span className="ml-auto flex items-center gap-3">
                      <span className="font-medium text-zinc-500">Delete this address?</span>
                      <button
                        type="button"
                        onClick={() => {
                          deleteAddress(address.id);
                          setConfirmId(null);
                        }}
                        className="text-red-600 hover:underline"
                      >
                        Yes, delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmId(null)}
                        className="text-zinc-600 hover:underline"
                      >
                        Keep
                      </button>
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmId(address.id)}
                      className="ml-auto text-zinc-500 hover:text-red-600"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
