import {
  BRAND_NAMES,
  PRICE_RANGES,
  formatStorage,
  ordinal,
} from "../data/products";

export const USE_TITLES = {
  student: "Student Laptops",
  business: "Business Laptops",
  touchscreen: "Touchscreen Laptops",
  "2-in-1": "2-in-1 Laptops",
  premium: "Premium / Performance Laptops",
};

// ---------------------------------------------------------------------------
// Scope: what the URL (?brand=, ?use=, ?price=) says this collection is about.
// ---------------------------------------------------------------------------

export function parseScope(searchParams = {}) {
  const first = (key) => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const brand = first("brand");
  const use = first("use");
  const price = first("price");

  return {
    brand: brand && brand in BRAND_NAMES ? brand : null,
    use: use && use in USE_TITLES ? use : null,
    price: PRICE_RANGES.some((r) => r.id === price && r.id !== "featured")
      ? price
      : null,
  };
}

export const scopeKey = (scope) =>
  `${scope.brand ?? "-"}|${scope.use ?? "-"}|${scope.price ?? "-"}`;

export function scopeTitle(scope) {
  const parts = [];
  if (scope.brand) parts.push(BRAND_NAMES[scope.brand]);
  if (scope.use) parts.push(USE_TITLES[scope.use]);
  if (scope.price) {
    const range = PRICE_RANGES.find((r) => r.id === scope.price);
    parts.push(`Laptops ${range.label}`);
  }
  return parts.length ? parts.join(" · ") : "All Renewed Laptops";
}

function inUse(product, use) {
  if (use === "touchscreen") return product.touch;
  if (use === "2-in-1") return product.twoInOne;
  return product.uses.includes(use);
}

function pricePoints(product) {
  if (product.variants?.length) return product.variants.map((v) => v.price);
  return [product.price, product.priceMax ?? product.price];
}

export function getScopeProducts(products, scope) {
  const range = PRICE_RANGES.find((r) => r.id === scope.price);
  return products.filter(
    (p) =>
      (!scope.brand || p.brand === scope.brand) &&
      (!scope.use || inUse(p, scope.use)) &&
      (!range || pricePoints(p).some((price) => price >= range.min && price <= range.max)),
  );
}

// ---------------------------------------------------------------------------
// Facets: the filter groups in the sidebar.
// ---------------------------------------------------------------------------

export const FACETS = {
  brand: { value: (p) => p.brand, label: (v) => BRAND_NAMES[v] },
  ram: { values: (p) => p.rams ?? [p.ram], label: (v) => `${v}GB` },
  ssd: { values: (p) => p.ssds ?? [p.ssd], label: (v) => formatStorage(v) },
  generation: { value: (p) => p.generation, label: (v) => `${ordinal(v)} Gen` },
  screen: { value: (p) => p.screen, label: (v) => `${v} Inch` },
  processor: { value: (p) => p.processor, label: (v) => v },
  availability: {
    value: (p) => (p.inStock ? "in" : "out"),
    label: (v) => (v === "in" ? "In Stock" : "Out Of Stock"),
  },
};

export const EMPTY_FILTERS = {
  brand: [],
  ram: [],
  ssd: [],
  generation: [],
  screen: [],
  processor: [],
  availability: [],
  price: null, // [min, max] | null
};

export function countActiveFilters(filters) {
  return (
    Object.keys(FACETS).reduce((sum, key) => sum + filters[key].length, 0) +
    (filters.price ? 1 : 0)
  );
}

function valuesOf(product, key) {
  const facet = FACETS[key];
  if (facet.values) return (facet.values(product) ?? []).filter((v) => v !== null && v !== undefined);
  const value = facet.value(product);
  return value === null || value === undefined ? [] : [value];
}

// Does `product` pass every active filter? `skip` ignores one group, which is
// how per-option counts are calculated.
export function matches(product, filters, skip = null) {
  for (const key of Object.keys(FACETS)) {
    if (key === skip || filters[key].length === 0) continue;
    const values = valuesOf(product, key);
    if (!filters[key].some((wanted) => values.includes(wanted))) return false;
  }
  if (filters.price && skip !== "price") {
    const prices = pricePoints(product);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    if (max < filters.price[0] || min > filters.price[1]) return false;
  }
  return true;
}

export function facetOptions(products, key) {
  const values = [...new Set(products.flatMap((p) => valuesOf(p, key)))];
  if (key === "availability") return values.sort((a) => (a === "in" ? -1 : 1));
  if (key === "brand") {
    return values.sort((a, b) => BRAND_NAMES[a].localeCompare(BRAND_NAMES[b]));
  }
  if (typeof values[0] === "number") return values.sort((a, b) => a - b);
  return values.sort((a, b) => String(a).localeCompare(String(b)));
}

export function facetCount(products, filters, key, value) {
  return products.filter(
    (p) => matches(p, filters, key) && valuesOf(p, key).includes(value),
  ).length;
}

export function priceBounds(products) {
  if (products.length === 0) return [0, 0];
  const prices = products.flatMap(pricePoints);
  return [
    Math.floor(Math.min(...prices) / 50) * 50,
    Math.ceil(Math.max(...prices) / 50) * 50,
  ];
}

// ---------------------------------------------------------------------------
// Sorting
// ---------------------------------------------------------------------------

export const SORT_OPTIONS = [
  { id: "best", label: "Best selling" },
  { id: "price-asc", label: "Price: low to high" },
  { id: "price-desc", label: "Price: high to low" },
];

export function sortProducts(products, sort) {
  const list = [...products]; // stable; "best" keeps catalogue order
  if (sort === "price-asc") list.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") list.sort((a, b) => (b.priceMax ?? b.price) - (a.priceMax ?? a.price));
  return list;
}
