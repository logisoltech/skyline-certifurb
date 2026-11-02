"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { importProductsAction } from "../../cms/actions/products";
import {
  MAX_IMPORT_ROWS,
  PRODUCT_COLUMNS,
  TEMPLATE_ROWS,
  csvToInputs,
  parseCsv,
  toCsv,
} from "../../lib/cms/csv";
import { planImport } from "../../lib/cms/import-plan";
import { Badge, Card, Notice, btnPrimary, btnSecondary } from "./ui";

const ACTION_TONE = { create: "green", update: "blue", skip: "zinc", error: "red" };

function downloadTemplate() {
  const headers = PRODUCT_COLUMNS.map(([column]) => column);
  const blob = new Blob([toCsv(headers, TEMPLATE_ROWS)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "certifurb-products-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function CsvImport({ products }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fileName, setFileName] = useState("");
  const [mode, setMode] = useState("upsert");
  const [parsed, setParsed] = useState(null); // { rows, unknownHeaders, error }
  const [result, setResult] = useState(null); // server result after import
  const [message, setMessage] = useState(null);

  const preview = useMemo(() => {
    if (!parsed?.rows) return null;
    return planImport(parsed.rows, products, mode);
  }, [parsed, products, mode]);

  function handleFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setResult(null);
    setMessage(null);

    if (file.size > 512 * 1024) {
      setParsed({ error: "Keep the file under 512 KB." });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        const table = parseCsv(String(reader.result ?? ""));
        if (table.length < 2) {
          setParsed({ error: "The file needs a header row and at least one product row." });
          return;
        }
        const { rows, unknownHeaders, fields } = csvToInputs(table);
        if (!fields.includes("sku") || !fields.includes("title")) {
          setParsed({ error: "The file must include sku and title columns." });
          return;
        }
        if (rows.length > MAX_IMPORT_ROWS) {
          setParsed({ error: `Import at most ${MAX_IMPORT_ROWS} rows at a time. This file has ${rows.length}.` });
          return;
        }
        setFileName(file.name);
        setParsed({ rows, unknownHeaders });
      } catch {
        setParsed({ error: "That file couldn't be read as CSV." });
      }
    };
    reader.readAsText(file);
  }

  function handleImport() {
    if (!parsed?.rows) return;
    setMessage(null);
    startTransition(async () => {
      const response = await importProductsAction(parsed.rows, mode);
      if (response.ok) {
        setResult(response);
        setParsed(null);
        setFileName("");
        router.refresh();
      } else {
        setMessage({ tone: "error", text: response.error ?? "Import failed." });
      }
    });
  }

  const canImport = preview && preview.summary.create + preview.summary.update > 0 && !pending;

  return (
    <div className="space-y-6">
      <Card title="1. Get the template">
        <p className="text-sm text-zinc-600">
          Columns are sku, title, brand, processor, generation, ram_gb, ssd_gb, screen_inch,
          touch, two_in_one, condition, price_aed, stock, status, featured, uses, warranty,
          image and slug. Brand must be one of hp, dell, lenovo, microsoft, apple, samsung,
          acer, asus. Uses are student, business, premium, separated by <code>|</code>.
          Rows that share a slug become options on one listing (for example 8GB and 16GB RAM).
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={downloadTemplate} className={btnSecondary}>
            Download template
          </button>
          <a href="/cms/export/products" className={btnSecondary} download>
            Export current catalogue
          </a>
        </div>
      </Card>

      <Card title="2. Upload the file">
        <div className="flex flex-wrap items-end gap-4">
          <label className="block text-xs font-bold text-zinc-800">
            CSV file
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleFile}
              className="mt-1.5 block w-full text-sm text-zinc-600 file:mr-3 file:h-9 file:rounded-lg file:border-0 file:bg-brand-950 file:px-4 file:text-xs file:font-bold file:text-white hover:file:bg-brand-700"
            />
          </label>
          <fieldset className="text-xs">
            <legend className="mb-1.5 font-bold text-zinc-800">If a SKU already exists</legend>
            <label className="mr-4 inline-flex items-center gap-2">
              <input type="radio" name="mode" checked={mode === "upsert"} onChange={() => setMode("upsert")} />
              Update it
            </label>
            <label className="inline-flex items-center gap-2">
              <input type="radio" name="mode" checked={mode === "create"} onChange={() => setMode("create")} />
              Skip it
            </label>
          </fieldset>
        </div>
        {fileName && <p className="mt-3 text-xs text-zinc-500">Loaded {fileName}</p>}
      </Card>

      {parsed?.error && <Notice tone="error">{parsed.error}</Notice>}
      {message && <Notice tone={message.tone}>{message.text}</Notice>}

      {result && (
        <Notice tone="success">
          Import finished: {result.summary.create} added, {result.summary.update} updated
          {result.summary.skip ? `, ${result.summary.skip} skipped` : ""}
          {result.summary.error ? `, ${result.summary.error} with errors` : ""}.{" "}
          <Link href="/cms/products" className="font-bold underline">
            View products
          </Link>
        </Notice>
      )}

      {preview && (
        <Card
          title="3. Preview"
          description={`${preview.results.length} rows · ${preview.summary.create} new · ${preview.summary.update} updates · ${preview.summary.skip} skipped · ${preview.summary.error} errors`}
          action={
            <button type="button" disabled={!canImport} onClick={handleImport} className={btnPrimary}>
              {pending ? "Importing…" : "Import valid rows"}
            </button>
          }
          padded={false}
        >
          {parsed.unknownHeaders?.length > 0 && (
            <p className="border-b border-amber-100 bg-amber-50 px-5 py-3 text-xs text-amber-900">
              Ignored unknown columns: {parsed.unknownHeaders.join(", ")}.
            </p>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-zinc-100 bg-zinc-50 text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Line</th>
                  <th className="px-4 py-3">Title</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {preview.results.slice(0, 80).map((row) => (
                  <tr key={row.line}>
                    <td className="px-4 py-2 text-xs text-zinc-500">{row.line}</td>
                    <td className="max-w-sm truncate px-4 py-2 font-semibold text-zinc-800">
                      {row.title || "—"}
                    </td>
                    <td className="px-4 py-2">
                      <Badge tone={ACTION_TONE[row.action]}>{row.action}</Badge>
                    </td>
                    <td className="px-4 py-2 text-xs text-zinc-600">
                      {row.note || row.errors.join(" ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {preview.results.length > 80 && (
            <p className="px-5 py-3 text-xs text-zinc-500">
              Showing the first 80 rows. All {preview.results.length} will be imported.
            </p>
          )}
        </Card>
      )}
    </div>
  );
}
