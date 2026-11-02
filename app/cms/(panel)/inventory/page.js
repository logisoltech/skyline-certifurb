import InventoryTable from "../../../components/cms/InventoryTable";
import { PageHeader } from "../../../components/cms/ui";
import { requireUser } from "../../../lib/cms/auth";
import { can } from "../../../lib/cms/constants";
import { readStore } from "../../../lib/cms/db";

export const metadata = { title: "Inventory" };

export default async function InventoryPage() {
  const [user, { products, settings }] = await Promise.all([requireUser(), readStore()]);

  return (
    <>
      <PageHeader
        title="Inventory"
        description="Units on hand for each option. Changing stock here updates availability on the store."
      />
      <InventoryTable
        products={products}
        threshold={settings.lowStockThreshold}
        canWrite={can(user.role, "inventory:write")}
      />
    </>
  );
}
