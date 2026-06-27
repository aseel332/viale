"use client";

import { useEffect, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { X, ShoppingBag, Check, Loader2 } from "lucide-react";
import {
  BOTTLE_SIZES,
  isSizeAvailable,
  resolveSizePrice,
  formatPrice,
  type BottleSize,
  type Product,
} from "@/lib/product-utils";
import { addCartItem } from "@/lib/client/commerce-api";

interface Props {
  product: Product;
  open: boolean;
  onClose: () => void;
}

export default function QuickViewModal({ product, open, onClose }: Props) {
  const router = useRouter();
  // Start on the first size that's actually on sale (30ml is off by default).
  const firstAvailableSize = BOTTLE_SIZES.find((s) => isSizeAvailable(product, s)) ?? 5;
  const [size, setSize] = useState<BottleSize>(firstAvailableSize);
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Escape to close. Background scroll is intentionally NOT locked — the
  // overlay still absorbs clicks (so an outside click only closes the modal),
  // while the page behind stays scrollable.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || typeof document === "undefined" || !document.body) return null;

  const selectedPricing = resolveSizePrice(product, size);
  const hasDiscount = selectedPricing.hasDiscount;
  const price = selectedPricing.price;
  const originalPrice = selectedPricing.original;
  const selectedSizeAvailable = isSizeAvailable(product, size);

  function handleAdd() {
    if (!selectedSizeAvailable) return;
    startTransition(async () => {
      const res = await addCartItem({ itemType: "product", productId: product.id, sizeMl: size, quantity: 1 });
      if (res.status === 401) {
        router.push(`/account?redirectTo=/products/${product.id}`);
        return;
      }
      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 2200);
    });
  }

  function handleBuyNow() {
    if (!selectedSizeAvailable) return;
    // Direct purchase of just this product+size — never pulls the whole cart in.
    const target = `/checkout?buyNow=${encodeURIComponent(product.id)}&size=${size}`;
    router.push(target);
  }

  // Render via a portal to <body> so the fixed overlay escapes any
  // transformed ancestor (e.g. AnimateIn) and truly covers the viewport.
  return createPortal(
    // Clicking anywhere on this overlay (outside the panel) closes the modal.
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/55 animate-fade-in" />

      {/* Panel — stops click propagation so inside clicks don't close it */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`${product.name} quick view`}
        onClick={(e) => e.stopPropagation()}
        className="relative bg-white w-full max-w-sm max-h-[88svh] overflow-y-auto shadow-2xl animate-slide-up p-7 sm:p-8"
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-[#6B6B6B] hover:text-[#111] transition-colors"
          aria-label="Close quick view"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-1.5">{product.brand}</p>
        <h2 className="text-[1.9rem] leading-tight font-[family-name:var(--font-cormorant)] font-medium italic text-[#111] pr-8 mb-2.5">
          {product.name}
        </h2>

        <div className="flex items-center gap-2 mb-4 text-[12px] text-[#6B6B6B]">
          <span className="text-[#C9A86C]">★</span>
          <span className="font-medium text-[#111]">{product.rating.toFixed(1)}</span>
          <span>·</span>
          <span>{product.family}</span>
          <span>·</span>
          <span>{product.gender}</span>
        </div>

        {/* Little description */}
        <p className="text-[13px] text-[#4A4A4A] leading-relaxed mb-5">{product.description}</p>

        {/* Notes */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {product.notes.slice(0, 4).map((n) => (
            <span key={n} className="text-[9px] tracking-[0.12em] uppercase text-[#6B6B6B] border border-[#E8E4DE] px-2.5 py-1">
              {n}
            </span>
          ))}
        </div>

        <div className="h-px bg-[#E8E4DE] mb-6" />

        {/* Size selector */}
        <p className="text-[10px] tracking-[0.2em] uppercase text-[#111] mb-3 font-medium">Select Size</p>
        <div className="flex gap-2 mb-6">
          {BOTTLE_SIZES.map((s) => {
            const available = isSizeAvailable(product, s);
            const selected = size === s && available;
            const sizePricing = resolveSizePrice(product, s);
            const sizePrice = sizePricing.price;
            const originalSizePrice = sizePricing.original;
            return (
              <button
                key={s}
                onClick={() => available && setSize(s)}
                disabled={!available}
                aria-disabled={!available}
                title={available ? undefined : `${s}ml is currently unavailable`}
                className={`flex-1 flex flex-col items-center py-3 border-2 transition-all ${
                  !available
                    ? "border-[#E8E4DE] text-[#B0ADA8] bg-[#F5F3EF] cursor-not-allowed"
                    : selected
                      ? "border-[#111] bg-[#111] text-white"
                      : "border-[#E8E4DE] text-[#111] hover:border-[#111]"
                }`}
              >
                <span className={`text-[14px] font-semibold ${!available ? "line-through" : ""}`}>{s}ml</span>
                <span className={`text-[10px] mt-0.5 ${!available ? "text-[#B0ADA8]" : selected ? "text-white/70" : "text-[#6B6B6B]"}`}>
                  {available ? (
                    <>
                      {formatPrice(sizePrice)}
                      {sizePricing.hasDiscount && (
                        <span className="ml-1 line-through opacity-70">
                          {formatPrice(originalSizePrice)}
                        </span>
                      )}
                    </>
                  ) : (
                    "Unavailable"
                  )}
                </span>
              </button>
            );
          })}
        </div>

        {/* Price */}
        <div className="flex items-baseline justify-between mb-5">
          <span className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B]">Total · {size}ml</span>
          <span className="text-right">
            <span className="block text-3xl font-[family-name:var(--font-cormorant)] font-medium text-[#111]">
              {formatPrice(price)}
            </span>
            {hasDiscount && (
              <span className="block text-sm text-[#6B6B6B] line-through">
                {formatPrice(originalPrice)}
              </span>
            )}
          </span>
        </div>

        {/* Actions */}
        <div className="space-y-2.5">
          <button
            onClick={handleAdd}
            disabled={isPending || !selectedSizeAvailable}
            className={`w-full flex items-center justify-center gap-2 py-3.5 text-[11px] tracking-[0.2em] uppercase font-medium transition-all disabled:opacity-60 disabled:cursor-not-allowed ${
              added ? "bg-[#3A7A3A] text-white" : "bg-[#111] text-white hover:bg-[#333]"
            }`}
          >
            {!selectedSizeAvailable ? (
              "Currently Unavailable"
            ) : (
              <>
                {isPending ? <Loader2 size={14} className="animate-spin" /> : added ? <Check size={14} /> : <ShoppingBag size={14} />}
                {added ? "Added to Bag" : "Add to Bag"}
              </>
            )}
          </button>
          <button
            onClick={handleBuyNow}
            disabled={isPending || !selectedSizeAvailable}
            className="w-full py-3.5 text-[11px] tracking-[0.2em] uppercase font-medium border border-[#111] text-[#111] hover:bg-[#111] hover:text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-[#111]"
          >
            Buy Now
          </button>
          <Link
            href={`/products/${product.id}`}
            className="block text-center text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] hover:text-[#111] transition-colors pt-1"
          >
            View full details →
          </Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}
