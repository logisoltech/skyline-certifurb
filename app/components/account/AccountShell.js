"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useRef } from "react";
import { signOut, useAccount } from "../../lib/auth";
import { formatDate } from "../../data/orders";
import {
  BoxIcon,
  GridIcon,
  HeartIcon,
  LogoutIcon,
  MapPinIcon,
  SettingsIcon,
  TruckIcon,
} from "../Icons";

const NAV = [
  { href: "/account", label: "Overview", icon: GridIcon, exact: true },
  { href: "/account/orders", label: "Order history", icon: BoxIcon },
  { href: "/account/track", label: "Track order", icon: TruckIcon },
  { href: "/account/wishlist", label: "Wishlist", icon: HeartIcon },
  { href: "/account/addresses", label: "Addresses", icon: MapPinIcon },
  { href: "/account/settings", label: "Settings", icon: SettingsIcon },
];

const LeaveContext = createContext((action) => action());

// Run an action that ends the session (sign out, delete account) and land
// on the homepage. Pages inside the account area use this.
export function useLeaveAccount() {
  return useContext(LeaveContext);
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

function Skeleton() {
  return (
    <div
      aria-hidden
      className="mx-auto max-w-7xl animate-pulse px-4 py-8 sm:px-6"
    >
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="h-72 rounded-3xl bg-brand-100/60" />
        <div className="space-y-4">
          <div className="h-24 rounded-3xl bg-brand-100/60" />
          <div className="h-64 rounded-3xl bg-brand-100/40" />
        </div>
      </div>
    </div>
  );
}

export default function AccountShell({ children }) {
  const pathname = usePathname();
  const router = useRouter();
  const { status, user, data } = useAccount();

  // Set when the user deliberately leaves (sign out / delete account) so the
  // guard below sends them to the homepage rather than /login.
  const leaving = useRef(false);

  useEffect(() => {
    if (status === "anonymous" && !leaving.current) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, pathname, router]);

  const leave = useCallback(
    (action) => {
      leaving.current = true;
      router.replace("/");
      action();
    },
    [router],
  );

  if (status !== "authenticated") return <Skeleton />;

  function handleSignOut() {
    leave(signOut);
  }

  const isActive = ({ href, exact }) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-8 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <aside>
          <div className="rounded-3xl border border-brand-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span
                aria-hidden
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-extrabold text-white"
              >
                {initials(user.name)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-extrabold text-brand-950">
                  {user.name}
                </p>
                <p className="truncate text-[11px] text-zinc-500">{user.email}</p>
              </div>
            </div>
            <p className="mt-3 text-[11px] text-zinc-500">
              Member since {formatDate(user.createdAt)}
            </p>
          </div>

          <nav
            aria-label="Account"
            className="-mx-4 mt-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"
          >
            <ul className="flex gap-2 lg:flex-col lg:gap-1">
              {NAV.map((item) => {
                const active = isActive(item);
                const Icon = item.icon;
                const count =
                  item.href === "/account/wishlist"
                    ? data.wishlist.length
                    : item.href === "/account/orders"
                      ? data.orders.length
                      : 0;
                return (
                  <li key={item.href} className="shrink-0">
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={`flex items-center gap-2.5 rounded-full px-4 py-2.5 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 lg:rounded-xl ${
                        active
                          ? "bg-brand-950 text-white"
                          : "bg-white text-zinc-700 ring-1 ring-brand-100 hover:text-brand-700 hover:ring-brand-300 lg:bg-transparent lg:ring-0 lg:hover:bg-brand-50"
                      }`}
                    >
                      <Icon width={17} height={17} />
                      <span className="flex-1 whitespace-nowrap">{item.label}</span>
                      {count > 0 && (
                        <span
                          className={`rounded-full px-1.5 text-[10px] ${
                            active ? "bg-white/20" : "bg-brand-100 text-brand-800"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
              <li className="shrink-0 lg:mt-2 lg:border-t lg:border-brand-100 lg:pt-2">
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2.5 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-zinc-700 ring-1 ring-brand-100 transition hover:text-red-600 hover:ring-red-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600 lg:rounded-xl lg:bg-transparent lg:ring-0 lg:hover:bg-red-50"
                >
                  <LogoutIcon width={17} height={17} />
                  <span className="whitespace-nowrap">Sign out</span>
                </button>
              </li>
            </ul>
          </nav>
        </aside>

        <LeaveContext.Provider value={leave}>
          <div className="min-w-0">{children}</div>
        </LeaveContext.Provider>
      </div>
    </div>
  );
}
