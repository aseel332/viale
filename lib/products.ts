// ── Constants ─────────────────────────────────────────────────
export const MIN_PRICE = 10;
export const MAX_PRICE = 50;

// ── Types ─────────────────────────────────────────────────────
export type Family      = "Fresh" | "Floral" | "Woody" | "Oriental" | "Gourmand" | "Chypre";
export type Gender      = "Men" | "Women" | "Unisex";
export type Season      = "Spring" | "Summer" | "Autumn" | "Winter";
export type SortOption  = "featured" | "price-asc" | "price-desc" | "rating";

export interface Product {
  id:        string;
  name:      string;
  brand:     string;
  price:     number;
  rating:    number;
  imageSrc:  string;
  tag?:      string;
  notes:     string[];
  family:    Family;
  gender:    Gender;
  seasons:   Season[];
}

export interface FilterState {
  priceRange: [number, number];
  families:   string[];
  notes:      string[];
  brands:     string[];
  genders:    string[];
  seasons:    string[];
  minRating:  number;
}

// ── Defaults ──────────────────────────────────────────────────
export const DEFAULT_FILTERS: FilterState = {
  priceRange: [MIN_PRICE, MAX_PRICE],
  families:   [],
  notes:      [],
  brands:     [],
  genders:    [],
  seasons:    [],
  minRating:  0,
};

// ── Catalogue ─────────────────────────────────────────────────
export const PRODUCTS: Product[] = [
  {
    id: "sauvage-dior",
    name: "Sauvage", brand: "Dior",
    price: 18, rating: 4.9,
    imageSrc: "/top_1.png", tag: "Bestseller",
    notes: ["Bergamot", "Pepper", "Ambroxan", "Vetiver"],
    family: "Fresh", gender: "Men", seasons: ["Summer", "Spring"],
  },
  {
    id: "tobacco-vanille-tf",
    name: "Tobacco Vanille", brand: "Tom Ford",
    price: 24, rating: 4.8,
    imageSrc: "/top_2.png", tag: "Top Pick",
    notes: ["Tobacco", "Vanilla", "Tonka Bean", "Sandalwood"],
    family: "Oriental", gender: "Unisex", seasons: ["Autumn", "Winter"],
  },
  {
    id: "aventus-creed",
    name: "Aventus", brand: "Creed",
    price: 30, rating: 4.9,
    imageSrc: "/top_3.png", tag: "Iconic",
    notes: ["Pineapple", "Blackcurrant", "Birch", "Ambergris"],
    family: "Fresh", gender: "Men", seasons: ["Spring", "Summer"],
  },
  {
    id: "baccarat-rouge-mfk",
    name: "Baccarat Rouge 540", brand: "Maison Francis Kurkdjian",
    price: 32, rating: 4.9,
    imageSrc: "/collection_img.png",
    notes: ["Jasmine", "Amberwood", "Cedar", "Saffron"],
    family: "Floral", gender: "Unisex", seasons: ["Spring", "Summer", "Autumn", "Winter"],
  },
  {
    id: "lost-cherry-tf",
    name: "Lost Cherry", brand: "Tom Ford",
    price: 26, rating: 4.7,
    imageSrc: "/collection_img.png",
    notes: ["Cherry", "Rose", "Tonka Bean", "Benzoin"],
    family: "Gourmand", gender: "Unisex", seasons: ["Autumn", "Winter"],
  },
  {
    id: "good-girl-ch",
    name: "Good Girl", brand: "Carolina Herrera",
    price: 16, rating: 4.6,
    imageSrc: "/collection_img.png", tag: "Bestseller",
    notes: ["Jasmine", "Cocoa", "Tuberose", "Sandalwood"],
    family: "Oriental", gender: "Women", seasons: ["Autumn", "Winter"],
  },
  {
    id: "flowerbomb-vr",
    name: "Flowerbomb", brand: "Viktor & Rolf",
    price: 16, rating: 4.6,
    imageSrc: "/collection_img.png", tag: "Top Pick",
    notes: ["Jasmine", "Rose", "Patchouli", "Vanilla"],
    family: "Floral", gender: "Women", seasons: ["Spring", "Summer"],
  },
  {
    id: "libre-ysl",
    name: "Libre", brand: "Yves Saint Laurent",
    price: 18, rating: 4.7,
    imageSrc: "/collection_img.png",
    notes: ["Lavender", "Jasmine", "Vanilla", "Musk"],
    family: "Floral", gender: "Women", seasons: ["Spring", "Summer", "Autumn", "Winter"],
  },
  {
    id: "bleu-chanel",
    name: "Bleu de Chanel", brand: "Chanel",
    price: 20, rating: 4.8,
    imageSrc: "/collection_img.png",
    notes: ["Citrus", "Grapefruit", "Sandalwood", "Vetiver"],
    family: "Fresh", gender: "Men", seasons: ["Spring", "Summer"],
  },
  {
    id: "black-orchid-tf",
    name: "Black Orchid", brand: "Tom Ford",
    price: 22, rating: 4.8,
    imageSrc: "/collection_img.png",
    notes: ["Black Orchid", "Patchouli", "Vetiver", "Incense"],
    family: "Oriental", gender: "Unisex", seasons: ["Autumn", "Winter"],
  },
  {
    id: "miss-dior",
    name: "Miss Dior", brand: "Dior",
    price: 20, rating: 4.8,
    imageSrc: "/collection_img.png",
    notes: ["Rose", "Iris", "Jasmine", "Peony"],
    family: "Floral", gender: "Women", seasons: ["Spring", "Summer"],
  },
  {
    id: "coco-mad-chanel",
    name: "Coco Mademoiselle", brand: "Chanel",
    price: 22, rating: 4.9,
    imageSrc: "/collection_img.png", tag: "Iconic",
    notes: ["Orange", "Rose", "Vetiver", "Patchouli"],
    family: "Chypre", gender: "Women", seasons: ["Spring", "Summer", "Autumn", "Winter"],
  },
  {
    id: "oud-wood-tf",
    name: "Oud Wood", brand: "Tom Ford",
    price: 28, rating: 4.7,
    imageSrc: "/collection_img.png",
    notes: ["Oud", "Sandalwood", "Vetiver", "Rosewood"],
    family: "Woody", gender: "Men", seasons: ["Autumn", "Winter"],
  },
  {
    id: "spicebomb-vr",
    name: "Spicebomb Extreme", brand: "Viktor & Rolf",
    price: 22, rating: 4.6,
    imageSrc: "/collection_img.png",
    notes: ["Tobacco", "Vanilla", "Cayenne", "Cardamom"],
    family: "Oriental", gender: "Men", seasons: ["Autumn", "Winter"],
  },
  {
    id: "lavb-lancome",
    name: "La Vie Est Belle", brand: "Lancôme",
    price: 14, rating: 4.5,
    imageSrc: "/collection_img.png",
    notes: ["Iris", "Jasmine", "Praline", "Patchouli"],
    family: "Gourmand", gender: "Women", seasons: ["Spring", "Summer", "Autumn", "Winter"],
  },
  {
    id: "si-intense-armani",
    name: "Sì Intense", brand: "Giorgio Armani",
    price: 18, rating: 4.7,
    imageSrc: "/collection_img.png",
    notes: ["Blackcurrant", "Rose", "Patchouli", "Vanilla"],
    family: "Chypre", gender: "Women", seasons: ["Autumn", "Winter"],
  },
  {
    id: "hacivat-nishane",
    name: "Hacivat", brand: "Nishane",
    price: 26, rating: 4.7,
    imageSrc: "/collection_img.png",
    notes: ["Pineapple", "Oakmoss", "Cedar", "Jasmine"],
    family: "Fresh", gender: "Unisex", seasons: ["Spring", "Summer"],
  },
  {
    id: "black-opium-ysl",
    name: "Black Opium", brand: "Yves Saint Laurent",
    price: 16, rating: 4.7,
    imageSrc: "/collection_img.png",
    notes: ["Coffee", "Vanilla", "White Flowers", "Patchouli"],
    family: "Oriental", gender: "Women", seasons: ["Autumn", "Winter"],
  },
];

// ── Filter option lists ────────────────────────────────────────
export const BRANDS         = [...new Set(PRODUCTS.map(p => p.brand))].sort();
export const FAMILIES       = ["Fresh", "Floral", "Woody", "Oriental", "Gourmand", "Chypre"] as const;
export const GENDERS        = ["Men", "Women", "Unisex"] as const;
export const SEASONS        = ["Spring", "Summer", "Autumn", "Winter"] as const;
export const FEATURED_NOTES = [
  "Rose", "Jasmine", "Vanilla", "Patchouli", "Sandalwood",
  "Vetiver", "Musk", "Oud", "Bergamot", "Cedar",
  "Iris", "Tobacco", "Coffee", "Citrus", "Lavender",
  "Pepper", "Incense", "Cherry", "Cocoa", "Amber",
];

export const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "featured",   label: "Featured"           },
  { value: "price-asc",  label: "Price: Low → High"  },
  { value: "price-desc", label: "Price: High → Low"  },
  { value: "rating",     label: "Top Rated"          },
];

// ── Filter + sort logic ───────────────────────────────────────
export function filterAndSort(
  products: Product[],
  filters: FilterState,
  sort: SortOption,
): Product[] {
  const out = products.filter(p => {
    if (p.price < filters.priceRange[0] || p.price > filters.priceRange[1]) return false;
    if (filters.families.length && !filters.families.includes(p.family))    return false;
    if (filters.notes.length   && !filters.notes.some(n => p.notes.includes(n)))  return false;
    if (filters.brands.length  && !filters.brands.includes(p.brand))         return false;
    if (filters.genders.length && !filters.genders.includes(p.gender))       return false;
    if (filters.seasons.length && !filters.seasons.some(s => p.seasons.includes(s as Season))) return false;
    if (filters.minRating > 0  && p.rating < filters.minRating)              return false;
    return true;
  });

  if (sort === "price-asc")  return [...out].sort((a, b) => a.price - b.price);
  if (sort === "price-desc") return [...out].sort((a, b) => b.price - a.price);
  if (sort === "rating")     return [...out].sort((a, b) => b.rating - a.rating);
  return out; // featured — preserve original order
}

// ── Helpers ───────────────────────────────────────────────────
export function countActiveFilters(f: FilterState): number {
  return [
    f.families.length > 0,
    f.notes.length    > 0,
    f.brands.length   > 0,
    f.genders.length  > 0,
    f.seasons.length  > 0,
    f.minRating       > 0,
    f.priceRange[0]   > MIN_PRICE || f.priceRange[1] < MAX_PRICE,
  ].filter(Boolean).length;
}
