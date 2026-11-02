import Image from "next/image";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "../../lib/cms/auth";

export const instant = false;

// Signed-in people have no business on the login/signup screens.
async function RedirectIfSignedIn({ children }) {
  if (await getCurrentUser()) redirect("/cms");
  return children;
}

export default function AuthLayout({ children }) {
  return (
    <main className="grid min-h-screen flex-1 lg:grid-cols-[1fr_1.1fr]">
      <aside className="relative hidden flex-col justify-between bg-brand-950 p-12 text-white lg:flex">
        <div className="rounded-2xl bg-white px-5 py-3 self-start">
          <Image
            src="/main-logo_1.png"
            alt="Certifurb"
            width={160}
            height={52}
            className="h-10 w-auto"
            preload
          />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-widest text-brand-400">
            Certifurb CMS
          </p>
          <h1 className="mt-3 max-w-md text-4xl font-extrabold leading-tight tracking-tight">
            Run your renewed-laptop store from one place.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-brand-200">
            Manage products and stock, import whole catalogues from a spreadsheet,
            follow orders and look after your team.
          </p>
        </div>
        <p className="text-xs text-brand-300">Staff access only.</p>
      </aside>

      <div className="flex items-center justify-center bg-zinc-50 px-5 py-12">
        <div className="w-full max-w-md">
          <Suspense fallback={<div aria-hidden className="h-96 animate-pulse rounded-3xl bg-zinc-100" />}>
            <RedirectIfSignedIn>{children}</RedirectIfSignedIn>
          </Suspense>
        </div>
      </div>
    </main>
  );
}
