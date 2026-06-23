"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Eye, ShoppingBag, Check, Loader2 } from "lucide-react";
import { effectiveBasePrice, formatPrice, type Product } from "@/lib/product-utils";
import { addCartItem, toggleWishlist } from "@/lib/client/commerce-api";
import QuickViewModal from "./QuickViewModal";

const QUICK_ADD_SIZE = 5; // default decant size for one-tap add

interface ProductCardProps {
  /** Full product — enables links, quick view and wishlist. */
  product?: Product;
  // Legacy display-only props (used where a full Product isn't available).
  name?:    string;
  brand?:   string;
  price?:   number | string;
  rating?:  number | string;
  imageSrc?: string;
  tag?:     string;
  notes?:   string[];
}

export default function ProductCard(props: ProductCardProps) {
  const { product } = props;
  const router = useRouter();
  const [quickOpen, setQuickOpen] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Resolve display values from the product or the legacy props.
  const name     = product?.name     ?? props.name     ?? "Winter Special";
  const brand    = product?.brand    ?? props.brand    ?? "Dior × Tom Ford";
  const imageSrc = product?.imageSrc ?? props.imageSrc ?? "/collection_img.png";
  const tag      = product?.tag      ?? props.tag;
  const notes    = product?.notes    ?? props.notes;
  const rawPrice = product ? effectiveBasePrice(product) : props.price ?? 28;
  const originalPrice = product?.price ?? null;
  const rawRating = product?.rating  ?? props.rating   ?? 4.8;

  const displayPrice  = typeof rawPrice === "number"  ? formatPrice(rawPrice) : rawPrice;
  const displayOriginalPrice = typeof originalPrice === "number" ? formatPrice(originalPrice) : null;
  const hasDiscount = Boolean(product && product.discountPrice && product.discountPrice > 0 && product.discountPrice < product.price);
  const displayRating = typeof rawRating === "number" ? rawRating.toFixed(1) : rawRating;
  const topNotes = notes?.slice(0, 3) ?? [];

  function quickAdd(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!product) return;
    startTransition(async () => {
      const res = await addCartItem({ itemType: "product", productId: product.id, sizeMl: QUICK_ADD_SIZE, quantity: 1 });
      if (res.status === 401) {
        router.push(`/account?redirectTo=/products/${product.id}`);
        return;
      }
      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 1800);
    });
  }

  function handleWishlist(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (!product) return;
    startTransition(async () => {
      const res = await toggleWishlist(product.id);
      if (res.status === 401) {
        router.push(`/account?redirectTo=/products/${product.id}`);
        return;
      }
      setWishlisted((p) => !p);
    });
  }

  function openQuick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setQuickOpen(true);
  }

  const cardInner = (
    <>
      <div className="relative overflow-hidden bg-[#F5F1EB] aspect-[3/4]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
            {product && (
              <button
                onClick={handleWishlist}
                className={`absolute top-3 right-3 p-1.5 transition-all duration-200 hover:scale-110 active:scale-95 ${
                  wishlisted ? "text-[#111]" : "text-[#111] opacity-0 group-hover:opacity-100"
                }`}
                aria-label="Add to wishlist"
              >
                <Heart size={16} strokeWidth={1.5} className="drop-shadow-sm" fill={wishlisted ? "currentColor" : "none"} />
              </button>
            )}

            {/* Quick View — desktop only, reveals on hover, kept uncrowded */}
            {product && (
              <button
                onClick={openQuick}
                className="hidden md:flex absolute bottom-3 left-3 items-center gap-1.5 bg-white/95 backdrop-blur-sm text-[#111] text-[9px] tracking-[0.18em] uppercase px-3 py-2 hover:bg-[#111] hover:text-white transition-all duration-300 shadow-sm opacity-0 group-hover:opacity-100"
              >
                <Eye size={12} strokeWidth={1.6} />
                Quick View
              </button>
            )}

            {/* Quick add — small icon. Always visible on mobile, hover on desktop. */}
            {product && (
              <button
                onClick={quickAdd}
                disabled={isPending}
                aria-label={`Add ${name} to bag`}
                className={`absolute bottom-3 right-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-all duration-300 active:scale-95 md:opacity-0 md:group-hover:opacity-100 disabled:opacity-60 ${
                  added ? "bg-[#3A7A3A] text-white" : "bg-[#111] text-white hover:bg-[#C9A86C] hover:text-[#111]"
                }`}
              >
                {isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : added ? (
                  <Check size={15} strokeWidth={2} />
                ) : (
                  <ShoppingBag size={15} strokeWidth={1.6} />
                )}
              </button>
            )}
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
          <span className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-[#111]">{displayPrice}</span>
            {hasDiscount && displayOriginalPrice && (
              <span className="text-[11px] text-[#6B6B6B] line-through">
                {displayOriginalPrice}
              </span>
            )}
          </span>
          <span className="text-[11px] text-[#6B6B6B]">★ {displayRating}</span>
        </div>
      </div>
    </>
  );

  return (
    <>
      <article className="group">
        {product ? (
          <Link href={`/products/${product.id}`} className="block cursor-pointer">
            {cardInner}
          </Link>
        ) : (
          <div className="block cursor-pointer">{cardInner}</div>
        )}
      </article>

      {product && (
        <QuickViewModal product={product} open={quickOpen} onClose={() => setQuickOpen(false)} />
      )}
    </>
  );
}
