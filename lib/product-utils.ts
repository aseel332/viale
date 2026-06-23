// ── Product model + browser-safe helpers ────────────────────────────────────
// Keep this file free of catalogue seed data. Client Components can import it
// without pulling the full static product list into the browser bundle.

export const USD_TO_INR = 83;
export function toINR(base: number): number {
  return Math.round((base * USD_TO_INR) / 10) * 10;
}

export const MIN_PRICE = 900;
export const MAX_PRICE = 2800;

export type Family = "Fresh" | "Floral" | "Woody" | "Oriental" | "Gourmand" | "Chypre";
export type Gender = "Men" | "Women" | "Unisex";
export type Season = "Spring" | "Summer" | "Autumn" | "Winter";
export type SortOption = "featured" | "price-asc" | "price-desc" | "rating";

export const BOTTLE_SIZES = [5, 10, 30] as const;
export type BottleSize = typeof BOTTLE_SIZES[number];

export const SIZE_MULTIPLIERS: Record<BottleSize, number> = {
  5: 1.0,
  10: 1.8,
  30: 4.5,
};

export function priceForSize(basePrice: number, size: BottleSize): number {
  return Math.round((basePrice * SIZE_MULTIPLIERS[size]) / 10) * 10;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  price: number;
  discountPrice?: number | null;
  rating: number;
  imageSrc: string;
  tag?: string;
  notes: string[];
  family: Family;
  gender: Gender;
  seasons: Season[];
  description: string;
  longDescription: string;
  bottleSizes: BottleSize[];
  isAvailable?: boolean;
}

export function effectiveBasePrice(product: Pick<Product, "price" | "discountPrice">): number {
  return product.discountPrice && product.discountPrice > 0 ? product.discountPrice : product.price;
}

export function formatPrice(value: number): string {
  return `₹${Math.round(value).toLocaleString("en-IN")}`;
}

export interface FilterState {
  priceRange: [number, number];
  families: string[];
  notes: string[];
  brands: string[];
  genders: string[];
  seasons: string[];
  minRating: number;
}

export const DEFAULT_FILTERS: FilterState = {
  priceRange: [MIN_PRICE, MAX_PRICE],
  families: [],
  notes: [],
  brands: [],
  genders: [],
  seasons: [],
  minRating: 0,
};

export const BRANDS = [
  "Carolina Herrera",
  "Chanel",
  "Creed",
  "Dior",
  "Giorgio Armani",
  "Lancôme",
  "Maison Francis Kurkdjian",
  "Nishane",
  "Tom Ford",
  "Viktor & Rolf",
  "Yves Saint Laurent",
] as const;

export const FAMILIES = ["Fresh", "Floral", "Woody", "Oriental", "Gourmand", "Chypre"] as const;
export const GENDERS = ["Men", "Women", "Unisex"] as const;
export const SEASONS = ["Spring", "Summer", "Autumn", "Winter"] as const;
export const FEATURED_NOTES = [
  "Rose", "Jasmine", "Vanilla", "Patchouli", "Sandalwood",
  "Vetiver", "Musk", "Oud", "Bergamot", "Cedar",
  "Iris", "Tobacco", "Coffee", "Citrus", "Lavender",
  "Pepper", "Incense", "Cherry", "Cocoa", "Amber",
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "rating", label: "Top Rated" },
];

export function filterAndSort(
  products: Product[],
  filters: FilterState,
  sort: SortOption,
): Product[] {
  const out = products.filter((product) => {
    const price = effectiveBasePrice(product);
    if (price < filters.priceRange[0] || price > filters.priceRange[1]) return false;
    if (filters.families.length && !filters.families.includes(product.family)) return false;
    if (filters.notes.length && !filters.notes.some((note) => product.notes.includes(note))) return false;
    if (filters.brands.length && !filters.brands.includes(product.brand)) return false;
    if (filters.genders.length && !filters.genders.includes(product.gender)) return false;
    if (filters.seasons.length && !filters.seasons.some((season) => product.seasons.includes(season as Season))) return false;
    if (filters.minRating > 0 && product.rating < filters.minRating) return false;
    return true;
  });

  if (sort === "price-asc") return [...out].sort((a, b) => effectiveBasePrice(a) - effectiveBasePrice(b));
  if (sort === "price-desc") return [...out].sort((a, b) => effectiveBasePrice(b) - effectiveBasePrice(a));
  if (sort === "rating") return [...out].sort((a, b) => b.rating - a.rating);
  return out;
}

export function countActiveFilters(
  filters: FilterState,
  defaultPriceRange: [number, number] = [MIN_PRICE, MAX_PRICE],
): number {
  return [
    filters.families.length > 0,
    filters.notes.length > 0,
    filters.brands.length > 0,
    filters.genders.length > 0,
    filters.seasons.length > 0,
    filters.minRating > 0,
    filters.priceRange[0] > defaultPriceRange[0] || filters.priceRange[1] < defaultPriceRange[1],
  ].filter(Boolean).length;
}
