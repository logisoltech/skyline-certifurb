// Small, dependency-free CSV reader/writer (RFC 4180 style): quoted fields,
// escaped quotes (""), commas and line breaks inside quotes, CRLF or LF, BOM.

export function parseCsv(text) {
  const src = String(text ?? "").replace(/^\uFEFF/, "");
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  // Ignore completely empty lines.
  return rows.filter((r) => r.some((cell) => cell.trim() !== ""));
}

// Spreadsheet apps run formulas that start with = + - @ ; prefix those so an
// exported file can't execute anything when opened.
function safeCell(value) {
  const text = value === null || value === undefined ? "" : String(value);
  const guarded = /^[=+\-@\t\r]/.test(text) && !/^-?\d+(\.\d+)?$/.test(text) ? `'${text}` : text;
  return /[",\r\n]/.test(guarded) ? `"${guarded.replace(/"/g, '""')}"` : guarded;
}

export function toCsv(headers, rows) {
  const lines = [headers.map(safeCell).join(",")];
  for (const row of rows) lines.push(headers.map((h) => safeCell(row[h])).join(","));
  return lines.join("\r\n") + "\r\n";
}

// ---------------------------------------------------------------------------
// Product CSV columns
// ---------------------------------------------------------------------------

// column header -> product field
export const PRODUCT_COLUMNS = [
  ["sku", "sku"],
  ["title", "title"],
  ["brand", "brand"],
  ["processor", "processor"],
  ["generation", "generation"],
  ["ram_gb", "ram"],
  ["ssd_gb", "ssd"],
  ["screen_inch", "screen"],
  ["touch", "touch"],
  ["two_in_one", "twoInOne"],
  ["condition", "condition"],
  ["price_aed", "price"],
  ["stock", "stock"],
  ["status", "status"],
  ["featured", "featured"],
  ["uses", "uses"],
  ["warranty", "warranty"],
  ["image", "image"],
  ["slug", "slug"],
];

// Lenient header matching: "RAM (GB)", "ram", "Ram_GB" all map to `ram`.
const HEADER_ALIASES = {
  sku: "sku",
  title: "title",
  name: "title",
  productname: "title",
  brand: "brand",
  processor: "processor",
  cpu: "processor",
  generation: "generation",
  gen: "generation",
  ram: "ram",
  ramgb: "ram",
  memory: "ram",
  ssd: "ssd",
  ssdgb: "ssd",
  storage: "ssd",
  storagegb: "ssd",
  screen: "screen",
  screeninch: "screen",
  screensize: "screen",
  touch: "touch",
  touchscreen: "touch",
  twoinone: "twoInOne",
  "2in1": "twoInOne",
  condition: "condition",
  grade: "condition",
  price: "price",
  priceaed: "price",
  stock: "stock",
  quantity: "stock",
  qty: "stock",
  status: "status",
  featured: "featured",
  uses: "uses",
  usecases: "uses",
  warranty: "warranty",
  image: "image",
  imagepath: "image",
  slug: "slug",
};

export function fieldForHeader(header) {
  const key = String(header).toLowerCase().replace(/[^a-z0-9]/g, "");
  return HEADER_ALIASES[key] ?? null;
}

// Kept modest so an import fits in one request (Server Actions cap bodies at
// 1MB by default).
export const MAX_IMPORT_ROWS = 500;

/**
 * Turns parsed CSV rows into [{ line, input }] objects keyed by product field.
 * Returns { rows, unknownHeaders, missingRequired } so the UI can explain
 * problems with the file itself before checking individual rows.
 */
export function csvToInputs(table) {
  if (table.length === 0) return { rows: [], unknownHeaders: [], fields: [] };
  const [headerRow, ...body] = table;
  const fields = headerRow.map(fieldForHeader);
  const unknownHeaders = headerRow.filter((_, i) => !fields[i] && headerRow[i].trim() !== "");

  const rows = body.map((cells, index) => {
    const input = {};
    fields.forEach((field, i) => {
      if (field) input[field] = (cells[i] ?? "").trim();
    });
    return { line: index + 2, input };
  });
  return { rows, unknownHeaders, fields: fields.filter(Boolean) };
}

export const TEMPLATE_ROWS = [
  {
    sku: "CF-LEN-101",
    title: 'Lenovo ThinkPad T14s Gen 2 14" Core i7 11th Gen 16GB RAM 512GB SSD Renewed Laptop',
    brand: "lenovo",
    processor: "Intel Core i7",
    generation: 11,
    ram_gb: 16,
    ssd_gb: 512,
    screen_inch: 14,
    touch: "no",
    two_in_one: "no",
    condition: "Excellent",
    price_aed: 1399,
    stock: 4,
    status: "published",
    featured: "no",
    uses: "business|premium",
    warranty: "6-month warranty",
    image: "/dell.png",
    slug: "lenovo-thinkpad-t14s-gen-2",
  },
  {
    sku: "CF-LEN-101B",
    title: 'Lenovo ThinkPad T14s Gen 2 14" Core i7 11th Gen 16GB RAM 512GB SSD Renewed Laptop',
    brand: "lenovo",
    processor: "Intel Core i7",
    generation: 11,
    ram_gb: 32,
    ssd_gb: 512,
    screen_inch: 14,
    touch: "no",
    two_in_one: "no",
    condition: "Excellent",
    price_aed: 1599,
    stock: 2,
    status: "published",
    featured: "no",
    uses: "business|premium",
    warranty: "6-month warranty",
    image: "/dell.png",
    slug: "lenovo-thinkpad-t14s-gen-2",
  },
  {
    sku: "CF-DEL-102",
    title: 'Dell Latitude 5420 14" Core i5 11th Gen 8GB RAM 256GB SSD Renewed Laptop',
    brand: "dell",
    processor: "Intel Core i5",
    generation: 11,
    ram_gb: 8,
    ssd_gb: 256,
    screen_inch: 14,
    touch: "no",
    two_in_one: "no",
    condition: "Good",
    price_aed: 949,
    stock: 6,
    status: "draft",
    featured: "no",
    uses: "student|business",
    warranty: "",
    image: "",
    slug: "",
  },
];
