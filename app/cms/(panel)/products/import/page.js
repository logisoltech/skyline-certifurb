import CsvImport from "../../../../components/cms/CsvImport";
import { PageHeader } from "../../../../components/cms/ui";
import { requireUser } from "../../../../lib/cms/auth";
import { readStore } from "../../../../lib/cms/db";

export const metadata = { title: "Bulk import" };

export default async function ImportPage() {
  const [, { products }] = await Promise.all([
    requireUser("products:write"),
    readStore(),
  ]);

  return (
    <>
      <PageHeader
        title="Bulk import"
        description="Add or update many laptops from a spreadsheet. Download the template, fill it in, then upload it here."
      />
      <CsvImport products={products} />
    </>
  );
}
