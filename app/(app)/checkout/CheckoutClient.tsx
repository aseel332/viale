"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Lock, CreditCard } from "lucide-react";
import { placeOrder } from "@/lib/client/commerce-api";
import type { CartLine } from "@/types/commerce";
import type { AddressRow, PaymentMethodRow } from "@/types/database";
import { formatPrice } from "@/lib/product-utils";

interface Props {
  lines: CartLine[];
  subtotal: number;
  shipping: number;
  defaultAddress: AddressRow | null;
  defaultName: string;
  defaultPhone: string;
  cards: PaymentMethodRow[];
  error?: string;
}

function Field({
  label, name, defaultValue, required, type = "text", placeholder, className = "",
}: {
  label: string; name: string; defaultValue?: string; required?: boolean;
  type?: string; placeholder?: string; className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">{label}</label>
      <input
        name={name}
        type={type}
        required={required}
        defaultValue={defaultValue}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white border border-[#E8E4DE] text-sm text-[#111] placeholder:text-[#B0ADA8] focus:outline-none focus:border-[#111] transition-colors"
      />
    </div>
  );
}

function PlaceOrderButton({ total, pending }: { total: number; pending: boolean }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase py-4 hover:bg-[#333] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
    >
      {pending ? <Loader2 size={14} className="animate-spin" /> : <Lock size={13} />}
      {pending ? "Placing Order…" : `Place Order · ${formatPrice(total)}`}
    </button>
  );
}

export default function CheckoutClient({
  lines, subtotal, shipping, defaultAddress, defaultName, defaultPhone, cards, error,
}: Props) {
  const router = useRouter();
  const total = subtotal + shipping;
  const [selectedCard, setSelectedCard] = useState<string>(
    cards.find((c) => c.is_default)?.id ?? cards[0]?.id ?? "new",
  );
  const [formError, setFormError] = useState(error ?? "");
  const [isPending, startTransition] = useTransition();

  function read(formData: FormData, name: string) {
    const value = formData.get(name);
    return typeof value === "string" ? value.trim() : "";
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");
    const formData = new FormData(event.currentTarget);

    startTransition(async () => {
      const result = await placeOrder({
        address: {
          full_name: read(formData, "full_name"),
          phone: read(formData, "phone") || undefined,
          line1: read(formData, "line1"),
          line2: read(formData, "line2") || undefined,
          landmark: read(formData, "landmark") || undefined,
          city: read(formData, "city"),
          state: read(formData, "state"),
          postal_code: read(formData, "postal_code"),
          country: "IN",
        },
        notes: read(formData, "notes") || null,
      });

      if (result.status === 401) {
        router.push("/account?redirectTo=/checkout");
        return;
      }

      if (result.error || !result.data?.orderId) {
        setFormError(result.error ?? "Could not create your order. Please try again.");
        return;
      }

      router.push(`/checkout/success?order=${result.data.orderId}`);
      router.refresh();
    });
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-20">
      <div className="max-w-screen-xl mx-auto px-5 md:px-10">
        <div className="mb-10">
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-2">Almost There</p>
          <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">
            Checkout
          </h1>
        </div>

        {formError && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm max-w-2xl">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── Left: shipping + payment ─────────────────────────── */}
          <div className="lg:col-span-2 space-y-10">
            {/* Shipping */}
            <section>
              <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111] mb-5 pb-3 border-b border-[#E8E4DE]">
                Shipping Address
              </h2>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Full Name" name="full_name" required defaultValue={defaultAddress?.full_name || defaultName} className="col-span-2" />
                <Field label="Address Line 1" name="line1" required defaultValue={defaultAddress?.line1} placeholder="House no., street, area" className="col-span-2" />
                <Field label="Address Line 2 (optional)" name="line2" defaultValue={defaultAddress?.line2 ?? undefined} placeholder="House/apartment name, tower, floor" className="col-span-2" />
                <Field label="Landmark" name="landmark" defaultValue={defaultAddress?.landmark ?? undefined} placeholder="e.g. Near Phoenix Mall" className="col-span-2" />
                <Field label="City" name="city" required defaultValue={defaultAddress?.city} />
                <Field label="State / Region" name="state" defaultValue={defaultAddress?.state} />
                <Field label="Postal Code" name="postal_code" required defaultValue={defaultAddress?.postal_code} />
                <div>
                  <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">Country</label>
                  <div className="w-full px-4 py-3 bg-[#FAFAF8] border border-[#E8E4DE] text-sm text-[#111]">India</div>
                  <input type="hidden" name="country" value="IN" />
                </div>
                <Field label="Phone (optional)" name="phone" type="tel" defaultValue={defaultAddress?.phone || defaultPhone} className="col-span-2" />
              </div>
            </section>

            {/* Payment */}
            <section>
              <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111] mb-5 pb-3 border-b border-[#E8E4DE]">
                Payment
              </h2>

              <div className="space-y-3">
                {cards.map((card) => (
                  <label
                    key={card.id}
                    className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                      selectedCard === card.id ? "border-[#111] bg-white" : "border-[#E8E4DE] bg-white hover:border-[#B0ADA8]"
                    }`}
                  >
                    <input
                      type="radio"
                      name="payment_method"
                      value={card.id}
                      checked={selectedCard === card.id}
                      onChange={() => setSelectedCard(card.id)}
                      className="accent-[#111]"
                    />
                    <CreditCard size={16} strokeWidth={1.5} className="text-[#6B6B6B]" />
                    <span className="text-[13px] text-[#111]">
                      {card.brand} ···· {card.last4}
                    </span>
                    <span className="text-[11px] text-[#6B6B6B] ml-auto">
                      {String(card.exp_month).padStart(2, "0")}/{String(card.exp_year).slice(-2)}
                    </span>
                  </label>
                ))}

                <label
                  className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                    selectedCard === "new" ? "border-[#111] bg-white" : "border-[#E8E4DE] bg-white hover:border-[#B0ADA8]"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value="new"
                    checked={selectedCard === "new"}
                    onChange={() => setSelectedCard("new")}
                    className="accent-[#111]"
                  />
                  <span className="text-[13px] text-[#111]">Pay on delivery / add card later</span>
                </label>
              </div>

              <p className="text-[11px] text-[#6B6B6B] leading-relaxed mt-4 border-l-2 border-[#C9A86C] pl-3">
                This is a demo checkout — no card is charged. Your order is recorded with status
                <span className="text-[#111] font-medium"> pending</span>. Connect a payment provider to take live payments.
              </p>
            </section>
          </div>

          {/* ── Right: order summary ─────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#E8E4DE] p-6 sticky top-28">
              <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111] mb-5">
                Your Order
              </h2>

              <div className="space-y-4 mb-5 max-h-72 overflow-y-auto pr-1">
                {lines.map((line) => (
                  <div key={line.id} className="flex gap-3">
                    <div className="w-12 aspect-[3/4] bg-[#F5F1EB] flex-shrink-0 overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={line.imageSrc} alt={line.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] font-medium text-[#111] leading-snug truncate">{line.name}</p>
                      <p className="text-[11px] text-[#6B6B6B]">
                        {line.sizeMl ? `${line.sizeMl}ml · ` : ""}Qty {line.quantity}
                      </p>
                    </div>
                    <p className="text-[12px] font-medium text-[#111] tabular-nums">{formatPrice(line.lineTotal)}</p>
                  </div>
                ))}
              </div>

              <div className="h-px bg-[#E8E4DE] my-4" />

              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between text-[#4A4A4A]">
                  <span>Subtotal</span><span className="tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#4A4A4A]">
                  <span>Shipping</span><span className="tabular-nums">{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
                </div>
              </div>

              <div className="h-px bg-[#E8E4DE] my-4" />

              <div className="flex justify-between items-baseline mb-6">
                <span className="text-[12px] tracking-[0.1em] uppercase text-[#111]">Total</span>
                <span className="text-2xl font-[family-name:var(--font-cormorant)] font-medium text-[#111] tabular-nums">
                  {formatPrice(total)}
                </span>
              </div>

              <PlaceOrderButton total={total} pending={isPending} />
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
