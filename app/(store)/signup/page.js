import { Suspense } from "react";
import SignupForm from "../../components/auth/SignupForm";

export const metadata = {
  title: "Create account | Certifurb",
  description: "Create a Certifurb account to track orders and save laptops.",
};

export default function SignupPage() {
  return (
    <Suspense fallback={<main className="flex-1" />}>
      <SignupForm />
    </Suspense>
  );
}
