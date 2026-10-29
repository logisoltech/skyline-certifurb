// Placeholder image for every product until real photos are available.
export const PLACEHOLDER_IMAGE = "/dell.png";

export const BRAND_NAMES = {
  hp: "HP",
  dell: "Dell",
  lenovo: "Lenovo",
  microsoft: "Microsoft Surface",
  apple: "Apple MacBook",
  samsung: "Samsung",
  acer: "Acer",
  asus: "ASUS",
};

export const ordinal = (n) => {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
};

export const formatStorage = (gb) =>
  gb >= 1024 ? `${gb / 1024}TB` : `${gb}GB`;

export const formatPrice = (value) => `AED ${value.toLocaleString("en-US")}`;

// Builds the spec chips shown on cards from the structured fields so the card
// and the collection filters can never disagree.
function buildProduct(base) {
  const specs = [
    base.processor,
    base.generation ? `${ordinal(base.generation)} Gen` : null,
    `${base.ram}GB`,
    formatStorage(base.ssd),
    `${base.screen} inch`,
    base.touch ? "Touch" : null,
    base.twoInOne ? "2-in-1" : null,
  ].filter(Boolean);

  return {
    warranty: "6-month warranty",
    image: PLACEHOLDER_IMAGE,
    inStock: true,
    touch: false,
    twoInOne: false,
    generation: null,
    uses: [],
    ...base,
    specs,
  };
}

// The catalogue, in "best selling" order. PLACEHOLDER DATA: replace with the
// real inventory when it's available.
export const ALL_PRODUCTS = [
  buildProduct({
    slug: "lenovo-thinkpad-t14-gen-2-ryzen-5-pro",
    title:
      'Lenovo ThinkPad T14 Gen 2 14" Ryzen 5 Pro 32GB RAM 512GB SSD Renewed Laptop',
    brand: "lenovo",
    processor: "AMD Ryzen 5 Pro",
    ram: 32,
    ssd: 512,
    screen: 14,
    condition: "Excellent",
    price: 1200,
    uses: ["business"],
  }),
  buildProduct({
    slug: "hp-elitebook-840-g7-core-i5",
    title:
      'HP EliteBook 840 G7 14" Core i5 10th Gen 8GB RAM 256GB SSD Renewed Laptop',
    brand: "hp",
    processor: "Intel Core i5",
    generation: 10,
    ram: 8,
    ssd: 256,
    screen: 14,
    condition: "Excellent",
    price: 999,
    uses: ["business", "student"],
  }),
  buildProduct({
    slug: "dell-latitude-5320-core-i5-touch",
    title:
      'Dell Latitude 5320 13.3" Core i5 11th Gen 16GB RAM 256GB SSD Touchscreen Renewed Laptop',
    brand: "dell",
    processor: "Intel Core i5",
    generation: 11,
    ram: 16,
    ssd: 256,
    screen: 13.3,
    touch: true,
    condition: "Good",
    price: 939,
    uses: ["business"],
  }),
  buildProduct({
    slug: "lenovo-thinkpad-l13-yoga-gen-2",
    title:
      'Lenovo ThinkPad L13 Yoga Gen 2 13.3" Core i5 11th Gen 16GB RAM x360 Touch Renewed Laptop',
    brand: "lenovo",
    processor: "Intel Core i5",
    generation: 11,
    ram: 16,
    ssd: 256,
    screen: 13.3,
    touch: true,
    twoInOne: true,
    condition: "Excellent",
    price: 939,
    uses: ["business"],
  }),
  buildProduct({
    slug: "lenovo-thinkpad-x1-carbon-gen-9",
    title:
      'Lenovo ThinkPad X1 Carbon Gen 9 14" Core i7 11th Gen 16GB RAM 512GB SSD Renewed Laptop',
    brand: "lenovo",
    processor: "Intel Core i7",
    generation: 11,
    ram: 16,
    ssd: 512,
    screen: 14,
    condition: "Excellent",
    price: 1499,
    uses: ["business", "premium"],
  }),
  buildProduct({
    slug: "lenovo-thinkpad-t490-core-i5",
    title:
      'Lenovo ThinkPad T490 14" Core i5 8th Gen 16GB RAM 256GB SSD Renewed Laptop',
    brand: "lenovo",
    processor: "Intel Core i5",
    generation: 8,
    ram: 16,
    ssd: 256,
    screen: 14,
    condition: "Good",
    price: 899,
    uses: ["student", "business"],
  }),
  buildProduct({
    slug: "microsoft-surface-laptop-3-core-i5",
    title:
      'Microsoft Surface Laptop 3 13.5" Core i5 10th Gen 8GB RAM 256GB SSD Touchscreen Renewed Laptop',
    brand: "microsoft",
    processor: "Intel Core i5",
    generation: 10,
    ram: 8,
    ssd: 256,
    screen: 13.5,
    touch: true,
    condition: "Excellent",
    price: 1149,
    uses: ["student"],
  }),
  buildProduct({
    slug: "dell-latitude-7420-core-i7",
    title:
      'Dell Latitude 7420 14" Core i7 11th Gen 16GB RAM 512GB SSD Renewed Laptop',
    brand: "dell",
    processor: "Intel Core i7",
    generation: 11,
    ram: 16,
    ssd: 512,
    screen: 14,
    condition: "Excellent",
    price: 1799,
    uses: ["business", "premium"],
  }),
  buildProduct({
    slug: "apple-macbook-pro-13-m1-2020",
    title:
      'Apple MacBook Pro 13.3" M1 8GB RAM 256GB SSD 2020 Renewed Laptop',
    brand: "apple",
    processor: "Apple M1",
    ram: 8,
    ssd: 256,
    screen: 13.3,
    condition: "Excellent",
    price: 1899,
    uses: ["student", "premium"],
  }),
  buildProduct({
    slug: "hp-zbook-firefly-15-g8",
    title:
      'HP ZBook Firefly 15 G8 15.6" Core i7 11th Gen 32GB RAM 512GB SSD Renewed Workstation',
    brand: "hp",
    processor: "Intel Core i7",
    generation: 11,
    ram: 32,
    ssd: 512,
    screen: 15.6,
    condition: "Excellent",
    price: 2199,
    inStock: false,
    uses: ["premium", "business"],
  }),
  buildProduct({
    slug: "lenovo-thinkpad-p15-gen-2-rtx",
    title:
      'Lenovo ThinkPad P15 Gen 2 15.6" Core i7 11th Gen 32GB RAM 1TB SSD RTX A2000 Renewed Workstation',
    brand: "lenovo",
    processor: "Intel Core i7",
    generation: 11,
    ram: 32,
    ssd: 1024,
    screen: 15.6,
    condition: "Excellent",
    price: 2899,
    uses: ["premium"],
  }),
  buildProduct({
    slug: "dell-precision-5560-core-i9",
    title:
      'Dell Precision 5560 15.6" Core i9 11th Gen 32GB RAM 1TB SSD Renewed Workstation',
    brand: "dell",
    processor: "Intel Core i9",
    generation: 11,
    ram: 32,
    ssd: 1024,
    screen: 15.6,
    condition: "Good",
    price: 3299,
    inStock: false,
    uses: ["premium"],
  }),
];

// The four products shown in "Featured renewed laptops".
const FEATURED_SLUGS = [
  "lenovo-thinkpad-t14-gen-2-ryzen-5-pro",
  "hp-elitebook-840-g7-core-i5",
  "dell-latitude-5320-core-i5-touch",
  "lenovo-thinkpad-l13-yoga-gen-2",
];

export const FEATURED_PRODUCTS = FEATURED_SLUGS.map((slug) =>
  ALL_PRODUCTS.find((p) => p.slug === slug),
);

// The ids double as the values of the `?price=` query param.
export const PRICE_RANGES = [
  { id: "featured", label: "Featured laptops" },
  { id: "899-999", label: "AED 899–999", min: 899, max: 999 },
  { id: "1000-1499", label: "AED 1000–1499", min: 1000, max: 1499 },
  { id: "1500-2499", label: "AED 1500–2499", min: 1500, max: 2499 },
  { id: "2500-plus", label: "AED 2500+", min: 2500, max: Infinity },
];
