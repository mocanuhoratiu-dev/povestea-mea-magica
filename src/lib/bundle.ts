export const bundleProducts = ["story", "monster", "emergency"] as const;

export type BundleProduct = (typeof bundleProducts)[number];

export type BundleConfigurationItem = {
  product: BundleProduct;
  configuration: Record<string, unknown>;
};

export type BundleOutputItem = {
  product: BundleProduct;
  output: Record<string, unknown>;
  coverObjectName?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isBundleProduct(value: unknown): value is BundleProduct {
  return typeof value === "string" && bundleProducts.includes(value as BundleProduct);
}

export function readBundleConfiguration(value: unknown): BundleConfigurationItem[] | null {
  if (!isRecord(value) || !Array.isArray(value.items) || value.items.length !== bundleProducts.length) return null;

  const items: BundleConfigurationItem[] = [];
  for (const rawItem of value.items) {
    if (!isRecord(rawItem) || !isBundleProduct(rawItem.product) || !isRecord(rawItem.configuration)) return null;
    const generation = rawItem.configuration.generation;
    if (!isRecord(generation) || generation.type !== rawItem.product) return null;
    items.push({ product: rawItem.product, configuration: rawItem.configuration });
  }

  const products = new Set(items.map((item) => item.product));
  return products.size === bundleProducts.length && bundleProducts.every((product) => products.has(product)) ? items : null;
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
