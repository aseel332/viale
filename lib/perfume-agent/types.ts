import type { Family, Gender, Season, BottleSize } from "@/lib/product-utils";

export type ImportSource = {
  title: string;
  url: string;
  publisher?: string;
  usedFor: string[];
};

export type PerfumeDiscoveryItem = {
  brand: string;
  name: string;
  segment: "popular" | "niche" | "designer" | "indie";
  reason: string;
  sourceUrls: string[];
};

export type PerfumeResearch = {
  brand: string;
  name: string;
  concentration: string | null;
  gender: Gender;
  family: Family;
  seasons: Season[];
  notes: string[];
  topNotes: string[];
  middleNotes: string[];
  baseNotes: string[];
  bottleImageUrl: string | null;
  description: string;
  longDescription: string;
  ratingEstimate: number;
  reviewCountEstimate: number | null;
  reviewSummary: string;
  popularitySignals: string[];
  sourceUrls: string[];
  sources: ImportSource[];
  confidence: number;
  missingFields: string[];
};

export type PerfumeDraftProduct = {
  id: string;
  name: string;
  brand: string;
  price: null;
  compareAtPrice: null;
  discountPrice: null;
  isAvailable: false;
  status: "draft";
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
  import: {
    generatedAt: string;
    concentration: string | null;
    sourceUrls: string[];
    sources: ImportSource[];
    reviewSummary: string;
    reviewCountEstimate: number | null;
    bottleImageUrl: string | null;
    popularitySignals: string[];
    confidence: number;
    missingFields: string[];
    imagePrompt: string | null;
  };
};

export type GeneratePerfumeInput = {
  brand: string;
  name: string;
  generateImage?: boolean;
  persist?: boolean;
  saveImage?: (image: { slug: string; b64: string; contentType: "image/png" }) => Promise<string>;
};

export type DiscoverPerfumeInput = {
  segment?: "popular" | "niche" | "designer" | "indie" | "mixed";
  brand?: string;
  limit?: number;
  exclude?: string[];
};
