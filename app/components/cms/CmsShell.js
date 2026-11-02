"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "../../cms/actions/auth";
import { ROLES, can } from "../../lib/cms/constants";
import {
  BoxIcon,
  CloseIcon,
  GridIcon,
  LogoutIcon,
  MenuIcon,
  PlusCircleIcon,
  ReceiptIcon,
  SettingsIcon,
  TagIcon,
  UploadIcon,
  UsersIcon,
} from "../Icons";

const GROUPS = [
  {
    label: null,
    items: [{ href: "/cms", label: "Dashboard", icon: GridIcon }],
  },
  {
    label: "Catalogue",
    items: [
      { href: "/cms/products", label: "Products", icon: TagIcon },
      { href: "/cms/products/new", label: "Add product", icon: PlusCircleIcon, permission: "products:write" },
      { href: "/cms/products/import", label: "Bulk import (CSV)", icon: UploadIcon, permission: "products:write" },
      { href: "/cms/inventory", label: "Inventory", icon: BoxIcon },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/cms/orders", label: "Orders", icon: ReceiptIcon },
      { href: "/cms/customers", label: "Customers", icon: UsersIcon },
    ],
  },
  {
    label: "Admin",
    items: [
      { href: "/cms/users", label: "CMS users", icon: UsersIcon, permission: "users:manage" },
      { href: "/cms/account", label: "My account", icon: SettingsIcon },
    ],
  },
];

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export default function CmsShell({ user, children }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer after navigating.
  useEffect(() => setOpen(false), [pathname]);

  const groups = GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((i) => !i.permission || can(user.role, i.permission)),
  })).filter((g) => g.items.length > 0);

  // Highlight the most specific match, so "/cms/products/new" doesn't also
  // light up "Products".
  const all = groups.flatMap((g) => g.items);
  const activeHref = all
    .filter((i) => (i.href === "/cms" ? pathname === "/cms" : pathname === i.href || pathname.startsWith(`${i.href}/`)))
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  const nav = (
    <nav aria-label="CMS" className="flex-1 overflow-y-auto px-3 py-4">
      {groups.map((group, index) => (
        <div key={group.label ?? index} className={index > 0 ? "mt-6" : ""}>
          {group.label && (
            <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-brand-400">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = href === activeHref;
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-400 ${
                      active
                        ? "bg-brand-600 text-white"
                        : "text-brand-100 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon width={18} height={18} />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );

  const brand = (
    <div className="flex items-center justify-between px-5 py-5">
      <Link href="/cms" aria-label="CMS dashboard" className="rounded-xl bg-white px-3 py-2">
        <Image src="/main-logo_1.png" alt="Certifurb" width={120} height={40} className="h-7 w-auto" />
      </Link>
      <button
        type="button"
        onClick={() => setOpen(false)}
        aria-label="Close menu"
        className="rounded-lg p-1.5 text-brand-100 hover:bg-white/10 lg:hidden"
      >
        <CloseIcon width={20} height={20} />
      </button>
    </div>
  );

  return (
    <div className="flex min-h-screen flex-1 bg-zinc-50">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-brand-950 lg:flex">
        {brand}
        {nav}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/50"
          />
          <aside className="relative flex h-full w-72 max-w-[85%] flex-col bg-brand-950">
            {brand}
            {nav}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-zinc-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="rounded-lg p-1.5 text-zinc-700 hover:bg-zinc-100 lg:hidden"
          >
            <MenuIcon width={22} height={22} />
          </button>

          <Link href="/" target="_blank" className="text-xs font-bold text-brand-700 hover:underline">
            View store ↗
          </Link>

          <div className="ml-auto flex items-center gap-3">
            <div className="hidden text-right leading-tight sm:block">
              <p className="text-xs font-bold text-zinc-900">{user.name}</p>
              <p className="text-[11px] text-zinc-500">{ROLES[user.role]?.label}</p>
            </div>
            <span
              aria-hidden
              className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-600 text-xs font-extrabold text-white"
            >
              {initials(user.name)}
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex h-9 items-center gap-2 rounded-lg border border-zinc-200 px-3 text-xs font-bold text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50"
              >
                <LogoutIcon width={16} height={16} />
                <span className="hidden sm:inline">Sign out</span>
              </button>
            </form>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
