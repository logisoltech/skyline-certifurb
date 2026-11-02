"use client";

import Link from "next/link";
import { useAccount } from "../lib/auth";
import { UserIcon } from "./Icons";

export default function NavAccountLink() {
  const { status, user } = useAccount();
  const signedIn = status === "authenticated";
  const firstName = signedIn ? user.name.trim().split(/\s+/)[0] : "";

  return (
    <Link
      href={signedIn ? "/account" : "/login"}
      aria-label={signedIn ? `My account, signed in as ${user.name}` : "Sign in"}
      className="group flex items-center gap-2 text-zinc-800"
    >
      <UserIcon width={26} height={26} className="transition group-hover:text-brand-700" />
      <span className="hidden text-left text-xs leading-tight sm:block">
        <span className="block text-zinc-500">Hello{signedIn ? `, ${firstName}` : ""}</span>
        {/* Hidden (not removed) while loading so the navbar doesn't jump. */}
        <span
          className={`block max-w-28 truncate font-semibold group-hover:text-brand-700 ${
            status === "loading" ? "invisible" : ""
          }`}
        >
          {signedIn ? "My Account" : "Sign In"}
        </span>
      </span>
    </Link>
  );
}
