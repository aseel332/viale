"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import ProductCard from "@/components/shopping/ProductCard";
import type { Product } from "@/lib/product-utils";

export default function SearchClient({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.brand.toLowerCase().includes(q) ||
        p.family.toLowerCase().includes(q) ||
        p.notes.some((n) => n.toLowerCase().includes(q)),
    );
  }, [products, query]);

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-20">
      <div className="max-w-screen-xl mx-auto px-5 md:px-10">
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
              placeholder="Search fragrances, brands, notes..."
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

        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-4xl font-[family-name:var(--font-cormorant)] italic text-[#111] mb-3">
              No results found
            </p>
            <p className="text-sm text-[#6B6B6B]">
              Try a different fragrance name, brand or note.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
