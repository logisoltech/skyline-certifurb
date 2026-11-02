import AccountShell from "../../components/account/AccountShell";

export const metadata = {
  title: "My account | Certifurb",
  // Private pages: keep them out of search results.
  robots: { index: false, follow: false },
};

export default function AccountLayout({ children }) {
  return (
    <main className="flex-1 bg-brand-50/40">
      <AccountShell>{children}</AccountShell>
    </main>
  );
}
