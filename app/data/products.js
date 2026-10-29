// Placeholder image for every product until real photos are available.
export const PLACEHOLDER_IMAGE = "/dell.png";

// Products shown in the "Featured renewed laptops" section.
export const FEATURED_PRODUCTS = [
  {
    slug: "lenovo-thinkpad-t14-gen-2-ryzen-5-pro",
    title:
      'Lenovo ThinkPad T14 Gen 2 14" Ryzen 5 Pro 32GB RAM 512GB SSD Renewed Laptop',
    specs: ["AMD Ryzen 5 Pro", "16", "512GB", "14 inch"],
    condition: "Excellent",
    warranty: "6-month warranty",
    price: 1200,
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "hp-elitebook-840-g7-core-i5",
    title:
      'HP EliteBook 840 G7 14" Core i5 10th Gen 8GB RAM 256GB SSD Renewed Laptop',
    specs: ["Intel Core i5", "10th Gen", "8GB", "256GB", "14 inch"],
    condition: "Excellent",
    warranty: "6-month warranty",
    price: 999,
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "dell-latitude-5320-core-i5-touch",
    title:
      'Dell Latitude 5320 13.3" Core i5 11th Gen 16GB RAM 256GB SSD Touchscreen Renewed Laptop',
    specs: ["Intel Core i5", "11th Gen", "16GB", "256GB", "13.3 inch", "Touch"],
    condition: "Good",
    warranty: "6-month warranty",
    price: 939,
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "lenovo-thinkpad-l13-yoga-gen-2",
    title:
      'Lenovo ThinkPad L13 Yoga Gen 2 13.3" Core i5 11th Gen 16GB RAM x360 Touch Renewed Laptop',
    specs: [
      "Intel Core i5",
      "11th Gen",
      "16GB",
      "256GB",
      "13.3 inch",
      "Touch",
      "2-in-1",
    ],
    condition: "Excellent",
    warranty: "6-month warranty",
    price: 939,
    image: PLACEHOLDER_IMAGE,
  },
];

// PLACEHOLDER products so the higher price tabs aren't empty while the real
// catalogue is being wired up. Replace with real data.
const EXTRA_PRODUCTS = [
  {
    slug: "dell-latitude-7420-core-i7",
    title:
      'Dell Latitude 7420 14" Core i7 11th Gen 16GB RAM 512GB SSD Renewed Laptop',
    specs: ["Intel Core i7", "11th Gen", "16GB", "512GB", "14 inch"],
    condition: "Excellent",
    warranty: "6-month warranty",
    price: 1799,
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "hp-zbook-firefly-15-g8",
    title:
      'HP ZBook Firefly 15 G8 15.6" Core i7 11th Gen 32GB RAM 512GB SSD Renewed Workstation',
    specs: ["Intel Core i7", "11th Gen", "32GB", "512GB", "15.6 inch"],
    condition: "Excellent",
    warranty: "6-month warranty",
    price: 2199,
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "lenovo-thinkpad-p15-gen-2-rtx",
    title:
      'Lenovo ThinkPad P15 Gen 2 15.6" Core i7 11th Gen 32GB RAM 1TB SSD RTX A2000 Renewed Workstation',
    specs: ["Intel Core i7", "11th Gen", "32GB", "1TB", "15.6 inch", "RTX"],
    condition: "Excellent",
    warranty: "6-month warranty",
    price: 2899,
    image: PLACEHOLDER_IMAGE,
  },
  {
    slug: "dell-precision-5560-core-i9",
    title:
      'Dell Precision 5560 15.6" Core i9 11th Gen 32GB RAM 1TB SSD Renewed Workstation',
    specs: ["Intel Core i9", "11th Gen", "32GB", "1TB", "15.6 inch"],
    condition: "Good",
    warranty: "6-month warranty",
    price: 3299,
    image: PLACEHOLDER_IMAGE,
  },
];

export const ALL_PRODUCTS = [...FEATURED_PRODUCTS, ...EXTRA_PRODUCTS];

export const PRICE_RANGES = [
  { id: "featured", label: "Featured laptops" },
  { id: "899-999", label: "AED 899–999", min: 899, max: 999 },
  { id: "1000-1499", label: "AED 1000–1499", min: 1000, max: 1499 },
  { id: "1500-2499", label: "AED 1500–2499", min: 1500, max: 2499 },
  { id: "2500-plus", label: "AED 2500+", min: 2500, max: Infinity },
];

export const formatPrice = (value) => `AED ${value.toLocaleString("en-US")}`;
