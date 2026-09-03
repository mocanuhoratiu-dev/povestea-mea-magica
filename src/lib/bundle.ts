export const familyBundleProducts = ["story", "monster", "emergency"] as const;
export const completeBundleProducts = ["story", "monster", "emergency", "album"] as const;
export const bundleProducts = completeBundleProducts;

export type BundleProduct = (typeof bundleProducts)[number];
export type BundleVariant = "family" | "complete";

export type BundleConfigurationItem = {
  product: BundleProduct;
  configuration: Record<string, unknown>;
};

export type BundleOutputItem = {
  product: BundleProduct;
  output: Record<string, unknown>;
  coverObjectName?: string;
};

export function bundleVariantForProductId(productId: string): BundleVariant | null {
  if (productId === "family-bundle") return "family";
  if (productId === "complete-bundle") return "complete";
  return null;
}

export function productsForBundleVariant(variant: BundleVariant) {
  return variant === "complete" ? completeBundleProducts : familyBundleProducts;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isBundleProduct(value: unknown): value is BundleProduct {
  return typeof value === "string" && bundleProducts.includes(value as BundleProduct);
}

export function readBundleConfiguration(value: unknown, variant?: BundleVariant): BundleConfigurationItem[] | null {
  if (!isRecord(value) || !Array.isArray(value.items)) return null;
  const inferredVariant = value.items.length === completeBundleProducts.length
    ? "complete"
    : value.items.length === familyBundleProducts.length
      ? "family"
      : null;
  const resolvedVariant = variant || inferredVariant;
  if (!resolvedVariant || (variant && inferredVariant !== variant)) return null;
  const expectedProducts = productsForBundleVariant(resolvedVariant);

  const items: BundleConfigurationItem[] = [];
  for (const rawItem of value.items) {
    if (!isRecord(rawItem) || !isBundleProduct(rawItem.product) || !isRecord(rawItem.configuration)) return null;
    const generation = rawItem.configuration.generation;
    if (!isRecord(generation) || generation.type !== rawItem.product) return null;
    items.push({ product: rawItem.product, configuration: rawItem.configuration });
  }

  const products = new Set(items.map((item) => item.product));
  return products.size === expectedProducts.length && expectedProducts.every((product) => products.has(product)) ? items : null;
}

export function readBundleOutput(value: unknown): BundleOutputItem[] {
  if (!isRecord(value) || !Array.isArray(value.items)) return [];

  return value.items.flatMap((rawItem) => {
    if (!isRecord(rawItem) || !isBundleProduct(rawItem.product) || !isRecord(rawItem.output)) return [];
    return [{
      product: rawItem.product,
      output: rawItem.output,
      ...(typeof rawItem.coverObjectName === "string" ? { coverObjectName: rawItem.coverObjectName } : {}),
    }];
  });
}
