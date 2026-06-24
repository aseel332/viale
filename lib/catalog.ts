import { createClient } from "@/lib/supabase/server";
import { cacheDel, cached } from "@/lib/cache/redis";
import { COLLECTIONS, type Collection as StaticCollection, type SeasonCategory } from "@/lib/collections";
import { PRODUCTS } from "@/lib/products";
import {
  type BottleSize,
  type Family,
  type Gender,
  type Product,
  type Season,
  type SizePricing,
  toINR,
} from "@/lib/product-utils";
import type { CollectionRow, ProductRow, SizePricingMap } from "@/types/database";

const CATALOG_TTL_SECONDS = 300;
const PRODUCTS_CACHE_KEY = "viale:catalog:products:v2";
const COLLECTIONS_CACHE_KEY = "viale:catalog:collections:v1";

export type StorefrontCollection = {
  id: string;
  number: string;
  name: string;
  subtitle: string;
  description: string;
  bundlePrice: number;
  category: SeasonCategory;
  isActive: boolean;
  productIds: string[];
  products: Product[];
};

type CollectionJoinRow = CollectionRow & {
  collection_items?: {
    product_id: string;
    sort_order: number;
    product: ProductRow | null;
  }[];
};

function asBottleSize(value: number): BottleSize | null {
  return value === 5 || value === 10 || value === 30 ? value : null;
}

function normalizePrice(value: number | null) {
  if (value == null) return null;
  const amount = Number(value);
  return amount > 0 && amount < 100 ? toINR(amount) : amount;
}

// Admin-entered per-size overrides are already INR; coerce keys/values and drop
// anything malformed so a bad row can never crash the storefront.
function sizePricingFromRow(value: SizePricingMap | null | undefined): SizePricing | null {
  if (!value || typeof value !== "object") return null;
  const out: SizePricing = {};
  for (const size of [5, 10, 30] as const) {
    const entry = value[String(size) as "5" | "10" | "30"];
    if (!entry) continue;
    const price = normalizePrice(entry.price ?? null);
    const discount = normalizePrice(entry.discount ?? null);
    if (price == null && discount == null) continue;
    out[size] = { price: price ?? undefined, discount: discount ?? undefined };
  }
  return Object.keys(out).length > 0 ? out : null;
}

export function productFromRow(row: ProductRow): Product {
  const bottleSizes = (row.bottle_sizes ?? [5, 10, 30])
    .map(asBottleSize)
    .filter((size): size is BottleSize => Boolean(size));

  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    price: normalizePrice(row.price) ?? 0,
    discountPrice: normalizePrice(row.discount_price),
    sizePricing: sizePricingFromRow(row.size_pricing),
    rating: Number(row.rating),
    imageSrc: row.image_path || "/collection_img.png",
    tag: row.tag ?? undefined,
    notes: row.notes ?? [],
    family: row.family as Family,
    gender: row.gender as Gender,
    seasons: (row.seasons ?? []) as Season[],
    description: row.description,
    longDescription: row.long_description || row.description,
    bottleSizes: bottleSizes.length > 0 ? bottleSizes : [5, 10, 30],
    isAvailable: row.is_active,
  };
}

function staticCollectionProducts(collection: StaticCollection) {
  return collection.productIds
    .map((productId) => PRODUCTS.find((product) => product.id === productId))
    .filter((product): product is Product => Boolean(product));
}

function collectionFromStatic(collection: StaticCollection): StorefrontCollection {
  return {
    id: collection.id,
    number: collection.number,
    name: collection.name,
    subtitle: collection.subtitle,
    description: collection.description,
    bundlePrice: collection.bundlePrice,
    category: collection.category,
    isActive: true,
    productIds: collection.productIds,
    products: staticCollectionProducts(collection),
  };
}

function collectionFromRow(row: CollectionJoinRow): StorefrontCollection {
  const items = [...(row.collection_items ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const products = items
    .map((item) => item.product ? productFromRow(item.product) : null)
    .filter((product): product is Product => Boolean(product));

  return {
    id: row.id,
    number: row.number,
    name: row.name,
    subtitle: row.subtitle,
    description: row.description,
    bundlePrice: Number(row.bundle_price),
    category: row.season_category,
    isActive: row.is_active,
    productIds: items.map((item) => item.product_id),
    products,
  };
}

export async function getStorefrontProducts(): Promise<Product[]> {
  return cached(PRODUCTS_CACHE_KEY, CATALOG_TTL_SECONDS, async () => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error || !data) return PRODUCTS;
      return data.map((row) => productFromRow(row as ProductRow));
    } catch {
      return PRODUCTS;
    }
  });
}

export async function getProductById(id: string): Promise<Product | null> {
  const products = await getStorefrontProducts();
  return products.find((product) => product.id === id) ?? null;
}

export async function getStorefrontCollections(): Promise<StorefrontCollection[]> {
  return cached(COLLECTIONS_CACHE_KEY, CATALOG_TTL_SECONDS, async () => {
    try {
      const supabase = await createClient();
      const { data, error } = await supabase
        .from("collections")
        .select("*, collection_items(product_id, sort_order, product:products(*))")
        .eq("is_active", true)
        .order("created_at", { ascending: true });

      if (error || !data) return COLLECTIONS.map(collectionFromStatic);
      return (data as unknown as CollectionJoinRow[]).map(collectionFromRow);
    } catch {
      return COLLECTIONS.map(collectionFromStatic);
    }
  });
}

export async function getStorefrontCollectionById(id: string): Promise<StorefrontCollection | null> {
  const collections = await getStorefrontCollections();
  return collections.find((collection) => collection.id === id) ?? null;
}

export function storefrontCollectionRetailTotal(collection: StorefrontCollection): number {
  return collection.products.reduce((sum, product) => sum + product.price, 0);
}

export async function invalidateCatalogCache() {
  await cacheDel([PRODUCTS_CACHE_KEY, COLLECTIONS_CACHE_KEY]);
}
