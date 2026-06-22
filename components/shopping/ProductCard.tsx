"use client";

import { Heart } from "lucide-react";

interface ProductCardProps {
  name?:    string;
  brand?:   string;
  price?:   number | string;
  rating?:  number | string;
  imageSrc?: string;
  tag?:     string;
  notes?:   string[];
}

export default function ProductCard({
  name     = "Winter Special",
  brand    = "Dior × Tom Ford",
  price    = 28,
  rating   = 4.8,
  imageSrc = "/collection_img.png",
  tag,
  notes,
}: ProductCardProps) {
  const displayPrice  = typeof price === "number"  ? `$${price}`  : price;
  const displayRating = typeof rating === "number" ? rating.toFixed(1) : rating;
  const topNotes = notes?.slice(0, 3) ?? [];

  return (
    <article className="group cursor-pointer">
      <div className="relative overflow-hidden bg-[#F5F1EB] aspect-[3/4]">
        <img
          src={imageSrc}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
        />
        {tag && (
          <div className="absolute top-3 left-3 bg-[#111] text-white text-[9px] tracking-[0.2em] uppercase px-2.5 py-1">
            {tag}
          </div>
        )}
        {/* Wishlist heart */}
        <button
          className="absolute top-3 right-3 p-1.5 text-[#111] opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:scale-110 active:scale-95"
          aria-label="Add to wishlist"
          onClick={(e) => e.stopPropagation()}
        >
          <Heart size={16} strokeWidth={1.5} className="drop-shadow-sm" />
        </button>
        <div className="absolute inset-0 flex items-end justify-center pb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button className="bg-white text-[#111] text-[10px] tracking-[0.2em] uppercase px-6 py-2.5 hover:bg-[#111] hover:text-white transition-colors duration-200 shadow-sm">
            Quick View
          </button>
        </div>
      </div>
      <div className="pt-3">
        <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1">{brand}</p>
        <p className="text-sm text-[#111] leading-snug line-clamp-1 font-medium">{name}</p>
        {topNotes.length > 0 && (
          <p className="text-[10px] text-[#6B6B6B] mt-0.5 leading-relaxed line-clamp-1">
            {topNotes.join(" · ")}
          </p>
        )}
        <div className="flex justify-between items-center mt-2">
          <span className="text-sm font-semibold text-[#111]">{displayPrice}</span>
          <span className="text-[11px] text-[#6B6B6B]">★ {displayRating}</span>
        </div>
      </div>
    </article>
  );
}
