import CustomersTable from "../../../components/cms/CustomersTable";
import { Notice, PageHeader } from "../../../components/cms/ui";
import { requireUser } from "../../../lib/cms/auth";
import { readStore } from "../../../lib/cms/db";

export const metadata = { title: "Customers" };

export default async function CustomersPage() {
  const [, { customers, orders }] = await Promise.all([requireUser(), readStore()]);
  const sample = customers.some((c) => c.sample);

  return (
    <>
      <PageHeader title="Customers" description="People who have ordered, or sample accounts used for the dashboard." />
      {sample && (
        <div className="mb-4">
          <Notice tone="info">
            These are sample customers until checkout is live and real accounts start coming in.
          </Notice>
        </div>
      )}
      <CustomersTable customers={customers} orders={orders} />
    </>
  );
}
