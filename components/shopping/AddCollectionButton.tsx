"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ShoppingBag, Check, Loader2 } from "lucide-react";
import { addCartItem } from "@/lib/client/commerce-api";
import { formatPrice } from "@/lib/product-utils";

export default function AddCollectionButton({
  collectionId,
  price,
}: {
  collectionId: string;
  price: number;
}) {
  const router = useRouter();
  const [added, setAdded] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleAdd(thenCheckout = false) {
    startTransition(async () => {
      const res = await addCartItem({ itemType: "collection", collectionId, quantity: 1 });
      if (res.status === 401) {
        router.push(`/account?redirectTo=/collections/${collectionId}`);
        return;
      }
      if (thenCheckout) {
        router.push("/checkout");
        return;
      }
      setAdded(true);
      router.refresh();
      setTimeout(() => setAdded(false), 2200);
    });
  }

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      <button
        onClick={() => handleAdd(false)}
        disabled={isPending}
        className={`flex-1 flex items-center justify-center gap-2 py-4 text-[11px] tracking-[0.2em] uppercase font-medium transition-all disabled:opacity-60 ${
          added ? "bg-[#3A7A3A] text-white" : "bg-[#111] text-white hover:bg-[#333]"
        }`}
      >
        {isPending ? <Loader2 size={14} className="animate-spin" /> : added ? <Check size={14} /> : <ShoppingBag size={14} />}
        {added ? "Added to Bag" : `Add Box · ${formatPrice(price)}`}
      </button>
      <button
        onClick={() => handleAdd(true)}
        disabled={isPending}
        className="flex-1 py-4 text-[11px] tracking-[0.2em] uppercase font-medium border border-[#111] text-[#111] hover:bg-[#111] hover:text-white transition-colors disabled:opacity-60"
      >
        Buy Now
      </button>
    </div>
  );
}
