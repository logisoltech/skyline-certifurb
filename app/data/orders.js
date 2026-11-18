import { ALL_PRODUCTS } from "./products";

// Aligned with CMS order statuses (app/lib/cms/constants.js).
export const ORDER_STEPS = [
  { id: "placed", label: "Order placed" },
  { id: "preparing", label: "Inspected & prepared" },
  { id: "dispatched", label: "Dispatched" },
  { id: "delivered", label: "Delivered" },
];

export const ORDER_STATUS = {
  placed: { label: "Order placed", tone: "info" },
  preparing: { label: "Being prepared", tone: "info" },
  dispatched: { label: "Dispatched", tone: "progress" },
  delivered: { label: "Delivered", tone: "done" },
  cancelled: { label: "Cancelled", tone: "muted" },
};

export const isActiveOrder = (order) =>
  order.status !== "delivered" && order.status !== "cancelled";

// Fixed-timezone formatting keeps server and client output identical.
const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Dubai",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "numeric",
  minute: "2-digit",
  hour12: true,
  timeZone: "Asia/Dubai",
});

export const formatDate = (iso) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso) => dateTimeFmt.format(new Date(iso));

// Resolves an order's items against the catalogue (or stored line fields).
export function describeOrder(order) {
  const lines = order.items
    .map((item) => {
      const catalog = ALL_PRODUCTS.find((p) => p.slug === item.slug);
      const price = item.price ?? catalog?.price ?? 0;
      const product = catalog
        ? { ...catalog, title: item.title || catalog.title, price }
        : {
            slug: item.slug,
            title: item.title || item.slug,
            image: "/dell.png",
            price,
          };
      return { product, qty: item.qty, lineTotal: price * item.qty };
    })
    .filter(Boolean);
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0);
  return { lines, subtotal, delivery: 0, total: order.total ?? subtotal };
}

// ---------------------------------------------------------------------------
// DEMO DATA, seeded into the demo account only. Real accounts start with no
// orders; replace this with your orders API.
// ---------------------------------------------------------------------------

const DEMO_ADDRESS = {
  name: "Ahmed Al Mansoori",
  phone: "+971 50 123 4567",
  line: "Villa 14, Al Majaz 2",
  area: "Al Majaz",
  emirate: "Sharjah",
};

export const DEMO_ORDERS = [
  {
    id: "CF-10517",
    placedAt: "2026-11-01T09:42:00Z",
    status: "processing",
    estimatedDelivery: "2026-11-05T00:00:00Z",
    items: [{ slug: "lenovo-thinkpad-t14-gen-2-ryzen-5-pro", qty: 1 }],
    payment: "Cash on Delivery",
    address: DEMO_ADDRESS,
    events: [
      { step: "placed", at: "2026-11-01T09:42:00Z", note: "We've received your order." },
      {
        step: "processing",
        at: "2026-11-01T14:10:00Z",
        note: "Hardware inspection and function tests are in progress at our Sharjah workshop.",
      },
    ],
  },
  {
    id: "CF-10498",
    placedAt: "2026-10-29T18:05:00Z",
    status: "out-for-delivery",
    estimatedDelivery: "2026-11-02T00:00:00Z",
    items: [
      { slug: "dell-latitude-5320-core-i5-touch", qty: 1 },
    ],
    payment: "Tabby (4 payments)",
    address: DEMO_ADDRESS,
    events: [
      { step: "placed", at: "2026-10-29T18:05:00Z", note: "We've received your order." },
      {
        step: "processing",
        at: "2026-10-30T07:30:00Z",
        note: "Inspected, cleaned and function-tested. Passed all checks.",
      },
      {
        step: "shipped",
        at: "2026-10-31T11:20:00Z",
        note: "Handed over to our delivery partner.",
      },
      {
        step: "out-for-delivery",
        at: "2026-11-02T06:45:00Z",
        note: "Your courier is on the way. Keep your phone nearby.",
      },
    ],
  },
  {
    id: "CF-10391",
    placedAt: "2026-09-18T12:30:00Z",
    status: "delivered",
    estimatedDelivery: "2026-09-21T00:00:00Z",
    items: [{ slug: "hp-elitebook-840-g7-core-i5", qty: 1 }],
    payment: "Visa ending 4242",
    address: DEMO_ADDRESS,
    events: [
      { step: "placed", at: "2026-09-18T12:30:00Z", note: "We've received your order." },
      { step: "processing", at: "2026-09-19T08:00:00Z", note: "Inspected and function-tested." },
      { step: "shipped", at: "2026-09-19T15:45:00Z", note: "Handed over to our delivery partner." },
      { step: "out-for-delivery", at: "2026-09-21T07:10:00Z", note: "Your courier is on the way." },
      { step: "delivered", at: "2026-09-21T11:32:00Z", note: "Delivered. Your 6-month warranty starts today." },
    ],
  },
  {
    id: "CF-10302",
    placedAt: "2026-08-03T16:20:00Z",
    status: "cancelled",
    estimatedDelivery: null,
    items: [{ slug: "microsoft-surface-laptop-3-core-i5", qty: 1 }],
    payment: "Cash on Delivery",
    address: DEMO_ADDRESS,
    events: [
      { step: "placed", at: "2026-08-03T16:20:00Z", note: "We've received your order." },
      {
        step: "cancelled",
        at: "2026-08-03T17:02:00Z",
        note: "Cancelled at your request. No payment was taken.",
      },
    ],
  },
];

export const DEMO_ADDRESSES = [
  {
    id: "addr-home",
    label: "Home",
    ...DEMO_ADDRESS,
    isDefault: true,
  },
  {
    id: "addr-work",
    label: "Work",
    name: "Ahmed Al Mansoori",
    phone: "+971 50 123 4567",
    line: "Office 308, Sharjah Publishing City Free Zone",
    area: "Sharjah Publishing City",
    emirate: "Sharjah",
    isDefault: false,
  },
];

export const DEMO_WISHLIST = [
  "lenovo-thinkpad-x1-carbon-gen-9",
  "apple-macbook-pro-13-m1-2020",
  "dell-latitude-7420-core-i7",
];
