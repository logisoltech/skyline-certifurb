import { Suspense } from "react";
import { LoginForm } from "../../../components/cms/AuthForms";
import { readStore } from "../../../lib/cms/db";

export const metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<div aria-hidden className="h-96 animate-pulse rounded-3xl bg-zinc-100" />}>
      <Login />
    </Suspense>
  );
}

async function Login() {
  const { users } = await readStore();
  return <LoginForm noUsersYet={users.length === 0} />;
}
