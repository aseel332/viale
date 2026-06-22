"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import ProductCard from "@/components/shopping/ProductCard";

const allProducts = [
  { name: "Sauvage",             brand: "Dior",                      price: "$18", rating: "4.9" },
  { name: "Tobacco Vanille",     brand: "Tom Ford",                  price: "$24", rating: "4.8" },
  { name: "Aventus",             brand: "Creed",                     price: "$30", rating: "4.9" },
  { name: "Baccarat Rouge 540",  brand: "Maison Francis Kurkdjian",  price: "$32", rating: "4.9" },
  { name: "Good Girl",           brand: "Carolina Herrera",          price: "$16", rating: "4.6" },
  { name: "Lost Cherry",         brand: "Tom Ford",                  price: "$26", rating: "4.7" },
  { name: "Flowerbomb",          brand: "Viktor & Rolf",             price: "$16", rating: "4.6" },
  { name: "Bleu de Chanel",      brand: "Chanel",                    price: "$20", rating: "4.8" },
  { name: "Miss Dior",           brand: "Dior",                      price: "$20", rating: "4.8" },
  { name: "Libre",               brand: "Yves Saint Laurent",        price: "$18", rating: "4.7" },
  { name: "Coco Mademoiselle",   brand: "Chanel",                    price: "$22", rating: "4.9" },
  { name: "Oud Wood",            brand: "Tom Ford",                  price: "$28", rating: "4.7" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");

  const filtered = query.length > 0
    ? allProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.brand.toLowerCase().includes(query.toLowerCase())
      )
    : allProducts;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-20">
      <div className="max-w-screen-xl mx-auto px-5 md:px-10">

        {/* Search bar */}
        <div className="max-w-xl mx-auto mb-14">
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-4 text-center">
            Search
          </p>
          <div className="relative">
            <Search
              size={18}
              strokeWidth={1.5}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6B6B6B]"
            />
            <input
              type="text"
              placeholder="Search fragrances, brands..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
              className="w-full pl-11 pr-5 py-4 bg-white border border-[#E8E4DE] text-sm text-[#111] placeholder:text-[#6B6B6B] focus:outline-none focus:border-[#111] transition-colors"
            />
          </div>
          {query && (
            <p className="text-[11px] text-[#6B6B6B] mt-3 text-center">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""} for &ldquo;{query}&rdquo;
            </p>
          )}
        </div>

        {/* Results */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
            {filtered.map((p) => (
              <ProductCard key={p.name} {...p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl font-[family-name:var(--font-cormorant)] italic text-[#111] mb-3">
              No results found
            </p>
            <p className="text-sm text-[#6B6B6B]">
              Try a different fragrance name or brand.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
