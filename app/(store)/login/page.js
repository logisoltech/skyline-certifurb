import { Suspense } from "react";
import LoginForm from "../../components/auth/LoginForm";

export const metadata = {
  title: "Sign in | Certifurb",
  description: "Sign in to your Certifurb account.",
};

// LoginForm reads ?next= via useSearchParams, which needs a Suspense boundary.
export default function LoginPage() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <LoginForm />
    </Suspense>
  );
}
