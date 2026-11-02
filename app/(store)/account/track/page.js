import { Suspense } from "react";
import TrackOrder from "../../../components/account/TrackOrder";

export const metadata = { title: "Track your order | Certifurb" };

// TrackOrder reads ?order= via useSearchParams, which needs Suspense.
export default function TrackPage() {
  return (
    <Suspense fallback={<div aria-hidden className="h-64 animate-pulse rounded-3xl bg-brand-100/50" />}>
      <TrackOrder />
    </Suspense>
  );
}
