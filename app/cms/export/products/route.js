import { getCurrentUser } from "../../../lib/cms/auth";
import { PRODUCT_COLUMNS, toCsv } from "../../../lib/cms/csv";
import { readStore } from "../../../lib/cms/db";
import { migrateProduct } from "../../../lib/cms/product-model";

// One CSV row per option so the file can be edited and imported back.
function flattenRows(products) {
  return products.flatMap((raw) => {
    const product = migrateProduct(raw);
    const variants = product.variants?.length ? product.variants : [product];
    return variants.map((variant) =>
      Object.fromEntries(
        PRODUCT_COLUMNS.map(([column, field]) => {
          const source = field === "sku" || field === "ram" || field === "ssd" || field === "price" || field === "stock"
            ? variant
            : product;
          const value = source[field];
          if (Array.isArray(value)) return [column, value.join("|")];
          if (typeof value === "boolean") return [column, value ? "yes" : "no"];
          return [column, value ?? ""];
        }),
      ),
    );
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { products } = await readStore();
  const headers = PRODUCT_COLUMNS.map(([column]) => column);

  return new Response(toCsv(headers, flattenRows(products)), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="certifurb-products.csv"',
      "Cache-Control": "no-store",
    },
  });
}
