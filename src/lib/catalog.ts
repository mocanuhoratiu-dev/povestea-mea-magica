export const checkoutProductIds = [
  "night-shield",
  "patience-kit",
  "complete-bundle",
  "illustrated-album-digital",
] as const;

export const legacyCheckoutProductIds = ["story-short", "story-long", "family-bundle"] as const;
export const storedCheckoutProductIds = [...checkoutProductIds, ...legacyCheckoutProductIds] as const;

export type ActiveCheckoutProductId = (typeof checkoutProductIds)[number];
export type CheckoutProductId = (typeof storedCheckoutProductIds)[number];

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
    name: "Povestea de Seară - scurtă",
    description: "Poveste personalizată cu copertă, dedicație și PDF.",
    amount: 1900,
    currency: "ron",
  },
  "story-long": {
    id: "story-long",
    name: "Povestea de Seară - lungă",
    description: "Poveste personalizată cu copertă, dedicație și PDF extins.",
    amount: 2900,
    currency: "ron",
  },
  "night-shield": {
    id: "night-shield",
    name: "Atelierul Scutului Magic",
    description: "Ritual personalizat de seară, pregătit pentru print.",
    amount: 1900,
    currency: "ron",
  },
  "patience-kit": {
    id: "patience-kit",
    name: "Dosarul Micului Explorator",
    description: "Activități personalizate pentru momentele de așteptare.",
    amount: 1900,
    currency: "ron",
  },
  "family-bundle": {
    id: "family-bundle",
    name: "Pachetul Familiei Magice",
    description: "O poveste lungă, un Atelier al Scutului Magic și un Dosar al Micului Explorator, personalizate separat.",
    amount: 4900,
    currency: "ron",
  },
  "complete-bundle": {
    id: "complete-bundle",
    name: "Pachetul Complet Povestea Mea Magică",
    description: "Povestea Magică ilustrată, caiet de activități, Atelier al Scutului Magic și Dosar al Micului Explorator.",
    amount: 7900,
    currency: "ron",
  },
  "illustrated-album-digital": {
    id: "illustrated-album-digital",
    name: "Povestea Magică - Digital",
    description: "Poveste ilustrată personalizată și caiet separat de activități, în format A5 orizontal.",
    amount: 5900,
    currency: "ron",
  },
};

export function isCheckoutProductId(value: unknown): value is ActiveCheckoutProductId {
  return typeof value === "string" && checkoutProductIds.includes(value as ActiveCheckoutProductId);
}
