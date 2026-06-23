// ── Viale — Curated Collections ───────────────────────────────
// Single source of truth for the curated 4-decant boxes.
// Used both for rendering (collections page + detail pages) and as the
// reference for the DB seed in supabase/migrations/003_*.sql.
//
// Each collection references real product IDs from lib/products.ts, so a
// collection's contents always resolve to live catalogue entries.

import { PRODUCTS } from "@/lib/products";
import type { Product } from "@/lib/product-utils";

export type SeasonCategory = "summer" | "winter" | "celebrity";

export interface Collection {
  id:           string;          // slug e.g. "summer-01"
  number:       string;          // "01", "02", …
  name:         string;
  subtitle:     string;          // one-line editorial copy
  description:  string;          // 1-2 paragraph editorial prose
  bundlePrice:  number;          // box price (USD)
  category:     SeasonCategory;
  productIds:   string[];        // exactly 4, in display order
}

export const COLLECTIONS: Collection[] = [
  // ── Summer ──────────────────────────────────────────────────
  {
    id: "summer-01", number: "01",
    name: "The Fresh Escape",
    subtitle: "Crisp, solar and unmistakably summer",
    description:
      "Four luminous scents built for long, bright days. Citrus-forward openings, airy woods and a whisper of the sea — this is the set you reach for when the sun is high and the evenings stretch on forever.",
    bundlePrice: 6140,
    category: "summer",
    productIds: ["sauvage-dior", "bleu-chanel", "hacivat-nishane", "libre-ysl"],
  },
  {
    id: "summer-02", number: "02",
    name: "Garden in Bloom",
    subtitle: "Floral and feminine, made for golden hours",
    description:
      "A bouquet in a box. Jasmine, rose and peony intertwine with luminous amber for a set that feels like an afternoon in full bloom — romantic, radiant and effortlessly elegant.",
    bundlePrice: 6810,
    category: "summer",
    productIds: ["flowerbomb-vr", "miss-dior", "baccarat-rouge-mfk", "coco-mad-chanel"],
  },

  // ── Winter ──────────────────────────────────────────────────
  {
    id: "winter-01", number: "01",
    name: "The Dark Luxe",
    subtitle: "Rich, smoky and built for cold nights",
    description:
      "Tobacco, oud and dark woods for the season of long shadows. Each scent in this set smoulders — deep, layered and built to linger on a coat collar long after you've left the room.",
    bundlePrice: 7300,
    category: "winter",
    productIds: ["tobacco-vanille-tf", "oud-wood-tf", "black-orchid-tf", "spicebomb-vr"],
  },
  {
    id: "winter-02", number: "02",
    name: "Sweet Noir",
    subtitle: "Warm, indulgent and dangerously addictive",
    description:
      "Cherry, coffee and cocoa wrapped in vanilla warmth. A gourmand quartet for candlelit evenings — sweet without ever being innocent, and impossible to ignore.",
    bundlePrice: 6310,
    category: "winter",
    productIds: ["lost-cherry-tf", "black-opium-ysl", "good-girl-ch", "coco-mad-chanel"],
  },

  // ── Celebrity ───────────────────────────────────────────────
  {
    id: "celeb-01", number: "01",
    name: "Red Carpet Ready",
    subtitle: "The most coveted names in luxury fragrance",
    description:
      "The set that turns heads. Four of the most recognised, most requested scents in modern perfumery — the fragrances spotted on the world's biggest names, decanted for you to try.",
    bundlePrice: 8630,
    category: "celebrity",
    productIds: ["baccarat-rouge-mfk", "aventus-creed", "coco-mad-chanel", "lost-cherry-tf"],
  },
  {
    id: "celeb-02", number: "02",
    name: "Power Signatures",
    subtitle: "Bold, commanding and impossible to ignore",
    description:
      "Commanding, confident, unmistakable. This set gathers the scents worn by those who walk into a room and own it — rich woods, dark spice and pure presence.",
    bundlePrice: 7970,
    category: "celebrity",
    productIds: ["tobacco-vanille-tf", "oud-wood-tf", "sauvage-dior", "aventus-creed"],
  },
];

// ── Helpers ───────────────────────────────────────────────────

export function getCollection(id: string): Collection | undefined {
  return COLLECTIONS.find((c) => c.id === id);
}

/** Resolve a collection's product IDs into full Product objects (in order). */
export function getCollectionProducts(collection: Collection): Product[] {
  return collection.productIds
    .map((pid) => PRODUCTS.find((p) => p.id === pid))
    .filter((p): p is Product => Boolean(p));
}

export function collectionsByCategory(category: SeasonCategory): Collection[] {
  return COLLECTIONS.filter((c) => c.category === category);
}

/** Sum of the individual 5ml prices — used to show "you save" vs. bundle. */
export function collectionRetailTotal(collection: Collection): number {
  return getCollectionProducts(collection).reduce((sum, p) => sum + p.price, 0);
}
