import Link from "next/link";

export default function CmsNotFound() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-zinc-50 px-6 text-center">
      <p className="text-sm font-bold text-brand-700">404</p>
      <h1 className="mt-2 text-2xl font-extrabold text-zinc-900">That page isn't in the CMS</h1>
      <p className="mt-2 max-w-md text-sm text-zinc-500">
        The link may be out of date, or you might not have access.
      </p>
      <Link
        href="/cms"
        className="mt-6 inline-flex h-10 items-center rounded-lg bg-brand-950 px-5 text-xs font-bold text-white hover:bg-brand-700"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
