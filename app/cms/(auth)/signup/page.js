import { Suspense } from "react";
import { SignupForm } from "../../../components/cms/AuthForms";
import { readStore } from "../../../lib/cms/db";

export const metadata = { title: "Request access" };

export default function SignupPage() {
  return (
    <Suspense fallback={<div aria-hidden className="h-96 animate-pulse rounded-3xl bg-zinc-100" />}>
      <Signup />
    </Suspense>
  );
}

async function Signup() {
  const { users } = await readStore();
  return <SignupForm firstRun={users.length === 0} />;
}
