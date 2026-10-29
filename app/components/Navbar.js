import Image from "next/image";
import Link from "next/link";
import {
  CartIcon,
  ChevronDownIcon,
  MailIcon,
  PhoneIcon,
  SearchIcon,
  UserIcon,
} from "./Icons";

const CONTACT = {
  phone: "+971 6 533 3033",
  email: "sales@skylinecomputer.ae",
};

function SearchForm({ className = "" }) {
  return (
    <form role="search" action="/search" className={`flex w-full ${className}`}>
      <label htmlFor="store-search" className="sr-only">
        Search the store
      </label>
      <input
        id="store-search"
        name="q"
        type="search"
        placeholder="Search the store"
        className="h-11 min-w-0 flex-1 rounded-l-lg border border-r-0 border-brand-100 bg-brand-50/60 px-4 text-sm text-foreground outline-none transition placeholder:text-zinc-500 focus:border-brand-500 focus:bg-white"
      />
      <button
        type="submit"
        aria-label="Search"
        className="flex h-11 w-12 items-center justify-center rounded-r-lg bg-brand-600 text-white transition hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600"
      >
        <SearchIcon />
      </button>
    </form>
  );
}

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top bar */}
      <div className="border-b border-brand-100 bg-brand-50">
        <div className="mx-auto flex h-9 max-w-7xl items-center justify-between px-4 text-xs text-zinc-700 sm:px-6">
          <div className="flex items-center gap-5">
            <a
              href={`tel:${CONTACT.phone.replace(/\s/g, "")}`}
              className="flex items-center gap-1.5 transition hover:text-brand-700"
            >
              <PhoneIcon width={14} height={14} className="text-brand-700" />
              <span className="hidden sm:inline">Call Us:</span>
              <span>{CONTACT.phone}</span>
            </a>
            <a
              href={`mailto:${CONTACT.email}`}
              className="hidden items-center gap-1.5 transition hover:text-brand-700 md:flex"
            >
              <MailIcon width={14} height={14} className="text-brand-700" />
              <span>{CONTACT.email}</span>
            </a>
          </div>
          <button
            type="button"
            className="flex items-center gap-1 font-medium transition hover:text-brand-700"
            aria-label="Language: English"
          >
            <span aria-hidden>🇬🇧</span>
            EN
            <ChevronDownIcon width={14} height={14} />
          </button>
        </div>
      </div>

      {/* Main bar */}
      <div className="border-b border-brand-100/80 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 sm:px-6 lg:gap-10">
          <Link href="/" aria-label="Certifurb – home" className="shrink-0">
            <Image
              src="/main-logo_1.png"
              alt="Certifurb – Certified Refurbished"
              width={1058}
              height={238}
              className="h-9 w-auto sm:h-11"
              loading="eager"
            />
          </Link>

          <div className="hidden max-w-2xl flex-1 md:block">
            <SearchForm />
          </div>

          <nav
            aria-label="Account"
            className="ml-auto flex items-center gap-5 sm:gap-7"
          >
            <Link
              href="/account"
              className="group flex items-center gap-2 text-zinc-800"
            >
              <UserIcon width={26} height={26} className="transition group-hover:text-brand-700" />
              <span className="hidden text-left text-xs leading-tight sm:block">
                <span className="block text-zinc-500">Hello</span>
                <span className="block font-semibold group-hover:text-brand-700">
                  Sign In
                </span>
              </span>
            </Link>

            <Link
              href="/cart"
              className="group flex items-center gap-2 text-zinc-800"
              aria-label="Cart, 0 items"
            >
              <span className="relative">
                <CartIcon width={26} height={26} className="transition group-hover:text-brand-700" />
                <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] font-semibold text-white sm:hidden">
                  0
                </span>
              </span>
              <span className="hidden items-center gap-1.5 text-xs font-semibold group-hover:text-brand-700 sm:flex">
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-[11px] text-white">
                  0
                </span>
                Cart
              </span>
            </Link>
          </nav>
        </div>

        {/* Mobile search */}
        <div className="px-4 pb-3 md:hidden">
          <SearchForm />
        </div>
      </div>
    </header>
  );
}
