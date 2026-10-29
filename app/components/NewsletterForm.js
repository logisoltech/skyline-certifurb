"use client";

import { useState } from "react";

export default function NewsletterForm() {
  const [status, setStatus] = useState("idle"); // idle | done

  function handleSubmit(event) {
    event.preventDefault();
    // TODO: send event.currentTarget.email.value to your mailing-list provider.
    setStatus("done");
    event.currentTarget.reset();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-md"
      aria-describedby="newsletter-status"
    >
      <div className="flex gap-2">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="Email address"
          autoComplete="email"
          onChange={() => status === "done" && setStatus("idle")}
          className="h-11 min-w-0 flex-1 rounded-full border border-white/15 bg-white/5 px-5 text-xs text-white outline-none transition placeholder:text-white/40 focus:border-brand-400 focus:bg-white/10"
        />
        <button
          type="submit"
          className="h-11 shrink-0 rounded-full bg-brand-500 px-6 text-xs font-bold text-brand-950 transition hover:bg-brand-400 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-300"
        >
          Join the list
        </button>
      </div>
      <p
        id="newsletter-status"
        role="status"
        className="mt-2 min-h-4 pl-2 text-[11px] text-brand-300"
      >
        {status === "done" ? "Thanks! You're on the list." : ""}
      </p>
    </form>
  );
}
