import AccountForms from "../../../components/cms/AccountForms";
import { PageHeader } from "../../../components/cms/ui";
import { requireUser } from "../../../lib/cms/auth";

export const metadata = { title: "My account" };

export default async function AccountPage() {
  const user = await requireUser();
  return (
    <>
      <PageHeader title="My account" description="Your name and password for the CMS." />
      <AccountForms user={user} />
    </>
  );
}
