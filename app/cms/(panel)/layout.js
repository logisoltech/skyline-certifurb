import { Suspense } from "react";
import CmsShell from "../../components/cms/CmsShell";
import { requireUser } from "../../lib/cms/auth";

export const instant = false;

// Everything under here needs a signed-in CMS user. The check reads the
// session cookie (request-time data), so it sits inside <Suspense>.
async function Frame({ children }) {
  const user = await requireUser();
  return <CmsShell user={user}>{children}</CmsShell>;
}

function FrameSkeleton() {
  return (
    <div aria-hidden className="flex min-h-screen flex-1 bg-zinc-50">
      <div className="hidden w-64 shrink-0 bg-brand-950 lg:block" />
      <div className="flex-1">
        <div className="h-14 border-b border-zinc-200 bg-white" />
        <div className="p-8">
          <div className="h-8 w-48 animate-pulse rounded-lg bg-zinc-200" />
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-zinc-100" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PanelLayout({ children }) {
  return (
    <Suspense fallback={<FrameSkeleton />}>
      <Frame>{children}</Frame>
    </Suspense>
  );
}
