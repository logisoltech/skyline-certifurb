"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { setOrderStatusAction } from "../../cms/actions/orders";
import { ORDER_STATUSES } from "../../lib/cms/constants";
import { Notice, btnPrimary, inputClass } from "./ui";

export default function OrderStatusForm({ orderId, status }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [pending, start] = useTransition();
  const [message, setMessage] = useState(null);

  function handleSubmit(event) {
    event.preventDefault();
    setMessage(null);
    start(async () => {
      const result = await setOrderStatusAction(orderId, value);
      if (result.ok) {
        setMessage({ tone: "success", text: "Status updated." });
        router.refresh();
      } else {
        setMessage({ tone: "error", text: result.error });
      }
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {message && <Notice tone={message.tone}>{message.text}</Notice>}
      <label className="block text-xs font-bold text-zinc-800">
        Status
        <select
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={`${inputClass} mt-1.5`}
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </label>
      <button type="submit" disabled={pending || value === status} className={`${btnPrimary} w-full`}>
        {pending ? "Saving…" : "Update status"}
      </button>
    </form>
  );
}
