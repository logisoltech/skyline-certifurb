// Shared (server + client) CMS constants. Keep this file free of Node APIs.

import { BRAND_NAMES } from "../../data/products";

export { BRAND_NAMES };
export const BRANDS = Object.keys(BRAND_NAMES);
export const CONDITIONS = ["Excellent", "Good"];
export const USES = ["student", "business", "premium"];
export const STATUSES = ["published", "draft"];
export const DEFAULT_WARRANTY = "6-month warranty";
export const PLACEHOLDER_IMAGE = "/dell.png";

// Suggestions for the processor field (any text is accepted).
export const PROCESSOR_SUGGESTIONS = [
  "Intel Core i3",
  "Intel Core i5",
  "Intel Core i7",
  "Intel Core i9",
  "AMD Ryzen 5 Pro",
  "AMD Ryzen 7 Pro",
  "Apple M1",
  "Apple M2",
];

export const ORDER_STATUSES = [
  { id: "placed", label: "Order placed" },
  { id: "preparing", label: "Inspected & prepared" },
  { id: "dispatched", label: "Dispatched" },
  { id: "delivered", label: "Delivered" },
  { id: "cancelled", label: "Cancelled" },
];

// ---------------------------------------------------------------------------
// Roles & permissions. Every server action re-checks these; hiding a button
// in the UI is only a convenience.
// ---------------------------------------------------------------------------

export const ROLES = {
  owner: {
    label: "Owner",
    description: "Full access, including managing CMS users.",
    permissions: ["products:write", "inventory:write", "orders:write", "users:manage"],
  },
  manager: {
    label: "Manager",
    description: "Manage products, inventory and orders.",
    permissions: ["products:write", "inventory:write", "orders:write"],
  },
  editor: {
    label: "Editor",
    description: "Manage products and inventory.",
    permissions: ["products:write", "inventory:write"],
  },
  viewer: {
    label: "Viewer",
    description: "Read-only access to the dashboard, orders and customers.",
    permissions: [],
  },
};

export const ROLE_IDS = Object.keys(ROLES);

export function can(role, permission) {
  return Boolean(ROLES[role]?.permissions.includes(permission));
}
