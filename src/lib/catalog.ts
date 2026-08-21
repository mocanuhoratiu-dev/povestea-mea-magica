export const checkoutProductIds = [
  "story-short",
  "story-long",
  "night-shield",
  "patience-kit",
  "family-bundle",
] as const;

export type CheckoutProductId = (typeof checkoutProductIds)[number];

export type CheckoutProduct = {
  id: CheckoutProductId;
  name: string;
  description: string;
  amount: number;
  currency: "ron";
};

// Checkout reads this catalog on the server. Never accept a price or currency
// sent by the browser, even when the product UI is updated later.
export const checkoutCatalog: Record<CheckoutProductId, CheckoutProduct> = {
  "story-short": {
    id: "story-short",
    name: "Povestea de Seara - scurta",
    description: "Poveste personalizata cu coperta, dedicatie si PDF.",
    amount: 1900,
    currency: "ron",
  },
  "story-long": {
    id: "story-long",
    name: "Povestea de Seara - lunga",
    description: "Poveste personalizata cu coperta, dedicatie si PDF extins.",
    amount: 2900,
    currency: "ron",
  },
  "night-shield": {
    id: "night-shield",
    name: "Scutul de Noapte",
    description: "Ritual personalizat de seara, pregatit pentru print.",
    amount: 1900,
    currency: "ron",
  },
  "patience-kit": {
    id: "patience-kit",
    name: "Trusa de Rabdare",
    description: "Activitati personalizate pentru momentele de asteptare.",
    amount: 1900,
    currency: "ron",
  },
  "family-bundle": {
    id: "family-bundle",
    name: "Pachetul Familiei Magice",
    description: "O poveste lunga, un Scut de Noapte si o Trusa de Rabdare, personalizate separat.",
    amount: 4900,
    currency: "ron",
  },
};

export function isCheckoutProductId(value: unknown): value is CheckoutProductId {
  return typeof value === "string" && checkoutProductIds.includes(value as CheckoutProductId);
}
