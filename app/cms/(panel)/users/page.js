import UsersManager from "../../../components/cms/UsersManager";
import { PageHeader } from "../../../components/cms/ui";
import { publicUser, requireUser } from "../../../lib/cms/auth";
import { readStore } from "../../../lib/cms/db";

export const metadata = { title: "CMS users" };

export default async function UsersPage() {
  const [me, { users }] = await Promise.all([
    requireUser("users:manage"),
    readStore(),
  ]);

  return (
    <>
      <PageHeader
        title="CMS users"
        description="Who can sign in to this admin area, and what they're allowed to do."
      />
      <UsersManager users={users.map(publicUser)} currentId={me.id} />
    </>
  );
}
