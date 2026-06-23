"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, Trash2, Loader2, ShoppingBag } from "lucide-react";
import { deleteCartItem, updateCartItem } from "@/lib/client/commerce-api";
import { formatPrice } from "@/lib/product-utils";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/shipping";
import type { CartLine } from "@/types/commerce";

interface Props {
  initialLines: CartLine[];
  subtotal: number;
  shipping: number;
}

export default function CartClient({ initialLines, subtotal, shipping }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function changeQty(line: CartLine, next: number) {
    setPendingId(line.id);
    startTransition(async () => {
      await updateCartItem(line.id, { quantity: next });
      router.refresh();
      setPendingId(null);
    });
  }

  function remove(line: CartLine) {
    setPendingId(line.id);
    startTransition(async () => {
      await deleteCartItem(line.id);
      router.refresh();
      setPendingId(null);
    });
  }

  if (initialLines.length === 0) {
    return (
      <div className="border border-[#E8E4DE] bg-white p-14 text-center max-w-lg">
        <ShoppingBag size={28} strokeWidth={1.2} className="mx-auto text-[#C9A86C] mb-4" />
        <p className="text-2xl font-[family-name:var(--font-cormorant)] italic text-[#111] mb-2">
          Your bag is empty
        </p>
        <p className="text-[13px] text-[#6B6B6B] mb-6">
          Discover your next signature scent.
        </p>
        <Link
          href="/"
          className="inline-block bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-[#333] transition-colors"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  const total = subtotal + shipping;
  const remainingForFree = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
      {/* ── Line items ─────────────────────────────────────────── */}
      <div className="lg:col-span-2">
        <div className="border-t border-[#E8E4DE]">
          {initialLines.map((line) => {
            const busy = pendingId === line.id;
            return (
              <div
                key={line.id}
                className={`flex gap-4 md:gap-6 py-6 border-b border-[#E8E4DE] transition-opacity ${busy ? "opacity-50" : ""}`}
              >
                {/* Image */}
                <div className="w-20 md:w-24 aspect-[3/4] bg-[#F5F1EB] flex-shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={line.imageSrc} alt={line.name} className="w-full h-full object-cover" />
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-0.5 truncate">
                        {line.brand}
                      </p>
                      <p className="text-[15px] font-medium text-[#111] leading-snug">
                        {line.itemType === "product" ? (
                          <Link href={`/products/${line.refId}`} className="hover:text-[#C9A86C] transition-colors">
                            {line.name}
                          </Link>
                        ) : (
                          <Link href={`/collections/${line.refId}`} className="hover:text-[#C9A86C] transition-colors">
                            {line.name}
                          </Link>
                        )}
                      </p>
                      {line.sizeMl && (
                        <p className="text-[12px] text-[#6B6B6B] mt-1">{line.sizeMl}ml</p>
                      )}
                    </div>
                    <button
                      onClick={() => remove(line)}
                      disabled={busy}
                      className="text-[#B0ADA8] hover:text-[#111] transition-colors h-fit"
                      aria-label="Remove item"
                    >
                      <Trash2 size={16} strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="flex items-end justify-between mt-auto pt-4">
                    {/* Quantity stepper */}
                    <div className="flex items-center border border-[#E8E4DE]">
                      <button
                        onClick={() => changeQty(line, line.quantity - 1)}
                        disabled={busy}
                        className="w-8 h-8 flex items-center justify-center text-[#6B6B6B] hover:text-[#111] hover:bg-[#F5F1EB] transition-colors disabled:opacity-40"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-9 text-center text-[13px] font-medium text-[#111] tabular-nums">
                        {busy ? <Loader2 size={12} className="animate-spin mx-auto" /> : line.quantity}
                      </span>
                      <button
                        onClick={() => changeQty(line, line.quantity + 1)}
                        disabled={busy}
                        className="w-8 h-8 flex items-center justify-center text-[#6B6B6B] hover:text-[#111] hover:bg-[#F5F1EB] transition-colors disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-[15px] font-semibold text-[#111] tabular-nums">
                        {formatPrice(line.lineTotal)}
                      </p>
                      {line.quantity > 1 && (
                        <p className="text-[11px] text-[#6B6B6B]">{formatPrice(line.unitPrice)} each</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <Link
          href="/"
          className="inline-block mt-6 text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] hover:text-[#111] transition-colors"
        >
          ← Continue shopping
        </Link>
      </div>

      {/* ── Summary ─────────────────────────────────────────────── */}
      <div className="lg:col-span-1">
        <div className="bg-white border border-[#E8E4DE] p-6 sticky top-28">
          <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111] mb-5">
            Order Summary
          </h2>

          <div className="space-y-3 text-[13px]">
            <div className="flex justify-between text-[#4A4A4A]">
              <span>Subtotal</span>
              <span className="tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#4A4A4A]">
              <span>Shipping</span>
              <span className="tabular-nums">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            {remainingForFree > 0 && (
              <p className="text-[11px] text-[#C9A86C] leading-relaxed">
                Add {formatPrice(remainingForFree)} more for free shipping.
              </p>
            )}
          </div>

          <div className="h-px bg-[#E8E4DE] my-5" />

          <div className="flex justify-between items-baseline mb-6">
            <span className="text-[12px] tracking-[0.1em] uppercase text-[#111]">Total</span>
            <span className="text-2xl font-[family-name:var(--font-cormorant)] font-medium text-[#111] tabular-nums">
              {formatPrice(total)}
            </span>
          </div>

          <Link
            href="/checkout"
            className="block w-full text-center bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase py-4 hover:bg-[#333] transition-colors"
          >
            Proceed to Checkout
          </Link>

          <p className="text-[11px] text-[#6B6B6B] leading-relaxed mt-4 text-center">
            Secure checkout · Ships in 24 hours · 100% authentic
          </p>
        </div>
      </div>
    </div>
  );
}
