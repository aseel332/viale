"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2, Lock, Truck, Wallet, CreditCard, MapPin, Plus, Pencil, Check, AlertCircle, RefreshCw, X,
} from "lucide-react";
import { getShippingQuote, placeOrder, verifyPayment, getPaymentStatus, abandonPayment } from "@/lib/client/commerce-api";
import type { BuyNowInput, CartLine, PaymentMethodChoice, ShippingQuoteResult } from "@/types/commerce";
import type { AddressRow } from "@/types/database";
import { formatPrice } from "@/lib/product-utils";
import { DELIVERY_ESTIMATE } from "@/lib/shipping";
import AddressFormModal from "@/components/account/AddressFormModal";

interface Props {
  lines: CartLine[];
  subtotal: number;
  addresses: AddressRow[];
  defaultName: string;
  defaultPhone: string;
  defaultEmail: string;
  onlinePaymentAvailable: boolean;
  buyNow: BuyNowInput | null;
  error?: string;
}

// Minimal Razorpay Checkout typings (script loaded on demand from the CDN).
type RazorpayResponse = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};
type RazorpayFailure = {
  error?: { description?: string; reason?: string; metadata?: { payment_id?: string } };
};
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: RazorpayResponse) => void;
  modal?: { ondismiss?: () => void };
};
type RazorpayInstance = {
  open: () => void;
  on: (event: "payment.failed", handler: (response: RazorpayFailure) => void) => void;
};
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

type RazorpayParams = { orderId: string; amount: number; keyId: string };

// Survives a refresh so an in-progress payment can be resumed rather than
// orphaned (which would create a duplicate order on retry).
const PENDING_PAYMENT_KEY = "viale_pending_payment";

const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = RAZORPAY_SCRIPT;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function persistPendingPayment(orderId: string) {
  try {
    sessionStorage.setItem(PENDING_PAYMENT_KEY, orderId);
  } catch {
    /* storage unavailable (private mode) — webhook + reconciliation still cover us */
  }
}
function readPendingPayment(): string | null {
  try {
    return sessionStorage.getItem(PENDING_PAYMENT_KEY);
  } catch {
    return null;
  }
}
function clearPendingPayment() {
  try {
    sessionStorage.removeItem(PENDING_PAYMENT_KEY);
  } catch {
    /* ignore */
  }
}

function formatAddressLine(a: AddressRow): string {
  return [
    a.line1,
    a.line2,
    a.landmark ? `Landmark: ${a.landmark}` : "",
    a.city,
    a.state,
    a.postal_code,
    "India",
  ]
    .filter(Boolean)
    .join(", ");
}

export default function CheckoutClient({
  lines, subtotal, addresses, defaultName, defaultPhone, defaultEmail, onlinePaymentAvailable, buyNow, error,
}: Props) {
  const router = useRouter();

  // ── Address book selection ──────────────────────────────────────────────────
  // `null` = follow the default/first address; a string = the user's explicit pick.
  const [pickedAddressId, setPickedAddressId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressRow | null>(null);

  // Derive the effective selection during render so it stays valid as the list
  // changes (e.g. after adding one) without a state-syncing effect.
  const selectedAddress = useMemo<AddressRow | null>(() => {
    if (addresses.length === 0) return null;
    return (
      (pickedAddressId ? addresses.find((a) => a.id === pickedAddressId) : undefined) ??
      addresses.find((a) => a.is_default) ??
      addresses[0]
    );
  }, [addresses, pickedAddressId]);
  const selectedAddressId = selectedAddress?.id ?? null;

  // ── Shipping quote (driven by the selected address's pincode) ────────────────
  const [quote, setQuote] = useState<ShippingQuoteResult | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState("");
  const [method, setMethod] = useState<PaymentMethodChoice>(onlinePaymentAvailable ? "razorpay" : "cod");
  const [contactEmail, setContactEmail] = useState(defaultEmail);
  const [notes, setNotes] = useState("");
  const [formError, setFormError] = useState(error ?? "");
  const [isPending, startTransition] = useTransition();

  // A payment that can be resumed/retried on the same Razorpay order — either
  // recovered after a refresh ("resume") or after a failed/cancelled attempt
  // ("failed"). Reusing the order prevents duplicate/orphaned orders.
  const [recovery, setRecovery] = useState<
    { orderId: string; razorpay: RazorpayParams; reason: "failed" | "cancelled" | "resume"; detail?: string } | null
  >(null);

  const postalCode = selectedAddress?.postal_code?.trim() ?? "";

  const fetchQuote = useCallback(async (code: string) => {
    setQuoteError("");
    setQuoteLoading(true);
    const res = await getShippingQuote(code, buyNow);
    setQuoteLoading(false);
    if (res.error || !res.data) {
      setQuote(null);
      setQuoteError(res.error ?? "Could not fetch shipping.");
      return;
    }
    setQuote(res.data);
    // If the chosen method isn't serviceable but the other is, switch.
    if (res.data.prepaid && res.data.cod) {
      if (method === "razorpay" && !res.data.prepaid.available && res.data.cod.available) setMethod("cod");
      if (method === "cod" && !res.data.cod.available && res.data.prepaid.available && onlinePaymentAvailable) setMethod("razorpay");
    }
  }, [method, onlinePaymentAvailable, buyNow]);

  // Re-quote whenever the selected address (its pincode) changes. State updates
  // run inside the timeout callback (not synchronously in the effect body) to
  // avoid cascading renders.
  useEffect(() => {
    const valid = /^\d{6}$/.test(postalCode);
    const timer = setTimeout(() => {
      if (!valid) {
        setQuote(null);
        setQuoteError(postalCode ? "This address has an invalid pincode — edit it to continue." : "");
        return;
      }
      void fetchQuote(postalCode);
    }, 0);
    return () => clearTimeout(timer);
  }, [postalCode, fetchQuote]);

  // On mount, recover any payment left in progress by a refresh/closed tab. The
  // status endpoint reconciles against Razorpay first, so a payment that did go
  // through is detected here and the buyer is sent straight to confirmation.
  useEffect(() => {
    const orderId = readPendingPayment();
    if (!orderId) return;
    let active = true;
    (async () => {
      const res = await getPaymentStatus(orderId);
      if (!active) return;
      if (res.data?.paymentStatus === "paid") {
        clearPendingPayment();
        router.push(`/checkout/success?order=${orderId}`);
        return;
      }
      if (res.data?.resumable && res.data.razorpay) {
        setRecovery({ orderId, razorpay: res.data.razorpay, reason: "resume" });
      } else {
        clearPendingPayment();
      }
    })();
    return () => {
      active = false;
    };
  }, [router]);

  const selected = quote ? (method === "cod" ? quote.cod : quote.prepaid) : null;
  const shippingCharge = selected?.available ? selected.charge : 0;
  const total = subtotal + shippingCharge;
  const canPlace = Boolean(selectedAddress && quote && selected?.available) && !isPending;

  function optionLabel(opt: ShippingQuoteResult["prepaid"] | undefined) {
    if (!selectedAddress) return "Select address";
    if (!quote) return "—";
    if (!opt?.available) return "Not serviceable";
    return opt.charge === 0 ? "Free" : formatPrice(opt.charge);
  }

  function openAddAddress() {
    setEditingAddress(null);
    setModalOpen(true);
  }
  function openEditAddress(address: AddressRow) {
    setEditingAddress(address);
    setModalOpen(true);
  }

  function currentContact() {
    const a = selectedAddress;
    return {
      name: a?.full_name || defaultName,
      email: contactEmail.trim() || defaultEmail,
      phone: a?.phone || defaultPhone,
    };
  }

  async function startRazorpay(orderId: string, razorpay: RazorpayParams) {
    const ready = await loadRazorpay();
    if (!ready || !window.Razorpay) {
      setFormError("Couldn't load the payment window. Please check your connection and try again.");
      return;
    }
    // We're committed to this order now; remember it so a refresh can resume.
    persistPendingPayment(orderId);
    setFormError("");

    const contact = currentContact();
    let settled = false; // guards against ondismiss firing after success/failure

    const rzp = new window.Razorpay({
      key: razorpay.keyId,
      amount: razorpay.amount,
      currency: "INR",
      name: "Viale",
      description: "Decant order",
      order_id: razorpay.orderId,
      prefill: { name: contact.name, email: contact.email, contact: contact.phone },
      theme: { color: "#111111" },
      handler: (response) => {
        settled = true;
        startTransition(async () => {
          const verify = await verifyPayment({
            orderId,
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          });
          if (verify.error) {
            // Signature/verify failed on the client path — the webhook and the
            // success-page reconciliation are the backstop, so send them there
            // to confirm rather than declaring failure prematurely.
            router.push(`/checkout/success?order=${orderId}`);
            return;
          }
          clearPendingPayment();
          router.push(`/checkout/success?order=${orderId}`);
          router.refresh();
        });
      },
      modal: {
        ondismiss: () => {
          if (settled) return;
          setRecovery({ orderId, razorpay, reason: "cancelled" });
        },
      },
    });

    // A genuine gateway/bank failure (card declined, etc.). The buyer can retry
    // on the same order without us creating a duplicate.
    rzp.on("payment.failed", (resp) => {
      settled = true;
      setRecovery({
        orderId,
        razorpay,
        reason: "failed",
        detail: resp.error?.description,
      });
    });

    rzp.open();
  }

  // Re-open Razorpay for an order we already created (retry or post-refresh
  // resume) — never creates a new order.
  function resumePayment() {
    if (!recovery) return;
    const { orderId, razorpay } = recovery;
    setRecovery(null);
    void startRazorpay(orderId, razorpay);
  }

  function dismissRecovery() {
    const orderId = recovery?.orderId;
    clearPendingPayment();
    setRecovery(null);
    if (!orderId) return;
    // Delete the abandoned order so it never lingers as a failed order. The
    // server reconciles first; if it was actually paid, send them to confirmation.
    void abandonPayment(orderId).then((res) => {
      if (res.data?.paid) router.push(`/checkout/success?order=${orderId}`);
    });
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError("");

    if (!selectedAddress) {
      setFormError("Please select or add a delivery address.");
      return;
    }
    if (method === "razorpay" && !onlinePaymentAvailable) {
      setFormError("Online payment is coming soon. Please choose Cash on Delivery.");
      return;
    }

    const address = selectedAddress;
    startTransition(async () => {
      const result = await placeOrder({
        address: {
          full_name: address.full_name,
          phone: address.phone || undefined,
          line1: address.line1,
          line2: address.line2 || undefined,
          landmark: address.landmark || undefined,
          city: address.city,
          state: address.state,
          postal_code: address.postal_code,
          country: "IN",
        },
        paymentMethod: method,
        contactEmail: contactEmail.trim() || null,
        notes: notes.trim() || null,
        buyNow: buyNow ?? undefined,
      });

      if (result.status === 401) {
        router.push("/account?redirectTo=/checkout");
        return;
      }
      if (result.error || !result.data) {
        setFormError(result.error ?? "Could not create your order. Please try again.");
        return;
      }

      if (result.data.paymentMethod === "cod") {
        router.push(`/checkout/success?order=${result.data.orderId}`);
        router.refresh();
        return;
      }

      if (result.data.razorpay) {
        await startRazorpay(result.data.orderId, result.data.razorpay);
      }
    });
  }

  const etdNote = selected?.etdDays
    ? `Estimated ${selected.etdDays} day${selected.etdDays > 1 ? "s" : ""} · arrives in ${DELIVERY_ESTIMATE}`
    : `Delivery in ${DELIVERY_ESTIMATE}`;

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-20">
      <div className="max-w-screen-xl mx-auto px-5 md:px-10">
        <div className="mb-10">
          <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-2">
            {buyNow ? "Express Checkout" : "Almost There"}
          </p>
          <h1 className="text-4xl md:text-5xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">
            Checkout
          </h1>
          {buyNow && (
            <p className="text-[12px] text-[#6B6B6B] mt-2">Buying this item only — your bag is untouched.</p>
          )}
        </div>

        {formError && (
          <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm max-w-2xl">
            {formError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* ── Left: address book + payment ─────────────────────── */}
          <div className="lg:col-span-2 space-y-10">
            <section>
              <div className="flex items-center justify-between mb-5 pb-3 border-b border-[#E8E4DE]">
                <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111]">
                  Delivery Address
                </h2>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={openAddAddress}
                    className="flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase text-[#111] hover:text-[#C9A86C] transition-colors"
                  >
                    <Plus size={14} /> Add New
                  </button>
                )}
              </div>

              {addresses.length === 0 ? (
                <div className="border border-dashed border-[#E8E4DE] p-10 text-center">
                  <MapPin size={24} strokeWidth={1.2} className="mx-auto text-[#C9A86C] mb-3" />
                  <p className="text-[13px] text-[#6B6B6B] mb-5">
                    You don&apos;t have a saved address yet. Add one to continue.
                  </p>
                  <button
                    type="button"
                    onClick={openAddAddress}
                    className="inline-flex items-center gap-2 bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-[#333] transition-colors"
                  >
                    <Plus size={14} /> Add Address
                  </button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {addresses.map((address) => {
                    const isSelected = address.id === selectedAddressId;
                    return (
                      <article
                        key={address.id}
                        onClick={() => setPickedAddressId(address.id)}
                        className={`relative cursor-pointer border p-5 transition-colors ${
                          isSelected ? "border-[#111] bg-white ring-1 ring-[#111]" : "border-[#E8E4DE] bg-white hover:border-[#B0ADA8]"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* Radio indicator */}
                          <span
                            className={`mt-0.5 flex h-4 w-4 flex-shrink-0 items-center justify-center rounded-full border ${
                              isSelected ? "border-[#111] bg-[#111]" : "border-[#B0ADA8] bg-white"
                            }`}
                            aria-hidden
                          >
                            {isSelected && <Check size={10} className="text-white" />}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-[11px] font-semibold tracking-[0.08em] uppercase text-[#111]">{address.label}</p>
                              {address.is_default && (
                                <span className="text-[9px] tracking-[0.12em] uppercase text-[#C9A86C]">Default</span>
                              )}
                            </div>
                            <p className="text-[13px] font-medium text-[#111]">{address.full_name}</p>
                            <p className="text-[12px] text-[#6B6B6B] leading-relaxed mt-1">{formatAddressLine(address)}</p>
                            {address.phone && <p className="text-[12px] text-[#6B6B6B] mt-1">{address.phone}</p>}
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); openEditAddress(address); }}
                              className="mt-3 inline-flex items-center gap-1 text-[10px] tracking-[0.12em] uppercase text-[#111] hover:text-[#C9A86C] transition-colors"
                            >
                              <Pencil size={12} /> Edit
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}

              {/* Contact email */}
              <div className="mt-6 max-w-md">
                <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">
                  Contact Email (for order updates)
                </label>
                <input
                  type="email"
                  inputMode="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full px-4 py-3 bg-white border border-[#E8E4DE] text-sm text-[#111] placeholder:text-[#B0ADA8] focus:outline-none focus:border-[#111] transition-colors"
                />
              </div>

              {/* Shipping status */}
              <div className="mt-4 flex items-start gap-2 text-[12px] text-[#4A4A4A] border-l-2 border-[#C9A86C] pl-3">
                <Truck size={15} className="mt-0.5 text-[#6B6B6B]" />
                <span>
                  {!selectedAddress
                    ? "Select a delivery address to see shipping and delivery time."
                    : quoteLoading
                      ? "Calculating shipping…"
                      : quoteError
                        ? quoteError
                        : !quote
                          ? "Calculating shipping…"
                          : !quote.serviceable
                            ? "Sorry, we can't ship to this pincode yet."
                            : etdNote}
                </span>
              </div>
            </section>

            {/* Payment */}
            <section>
              <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111] mb-5 pb-3 border-b border-[#E8E4DE]">
                Payment
              </h2>

              <div className="space-y-3">
                {/* Razorpay — always shown. Disabled (display-only) until configured. */}
                <label
                  className={`flex items-center gap-3 p-4 border transition-colors ${
                    onlinePaymentAvailable ? "cursor-pointer" : "cursor-not-allowed"
                  } ${
                    method === "razorpay" ? "border-[#111] bg-white" : "border-[#E8E4DE] bg-white hover:border-[#B0ADA8]"
                  } ${(!onlinePaymentAvailable || (quote && !quote.prepaid.available)) ? "opacity-60" : ""}`}
                >
                  <input
                    type="radio" name="payment_method_radio" value="razorpay"
                    checked={method === "razorpay"}
                    disabled={!onlinePaymentAvailable || Boolean(quote && !quote.prepaid.available)}
                    onChange={() => setMethod("razorpay")}
                    className="accent-[#111]"
                  />
                  <CreditCard size={16} strokeWidth={1.5} className="text-[#6B6B6B]" />
                  <span className="text-[13px] text-[#111] flex items-center gap-2">
                    Razorpay — Pay online (UPI / Card / Netbanking)
                    {!onlinePaymentAvailable && (
                      <span className="text-[9px] tracking-[0.12em] uppercase text-[#C9A86C] border border-[#E8DCC2] bg-[#FBF6EC] px-2 py-0.5">
                        Coming soon
                      </span>
                    )}
                  </span>
                  <span className="text-[12px] text-[#6B6B6B] ml-auto tabular-nums">
                    {onlinePaymentAvailable ? `Shipping ${optionLabel(quote?.prepaid)}` : ""}
                  </span>
                </label>

                <label
                  className={`flex items-center gap-3 p-4 border cursor-pointer transition-colors ${
                    method === "cod" ? "border-[#111] bg-white" : "border-[#E8E4DE] bg-white hover:border-[#B0ADA8]"
                  } ${quote && !quote.cod.available ? "opacity-50" : ""}`}
                >
                  <input
                    type="radio" name="payment_method_radio" value="cod"
                    checked={method === "cod"}
                    disabled={Boolean(quote && !quote.cod.available)}
                    onChange={() => setMethod("cod")}
                    className="accent-[#111]"
                  />
                  <Wallet size={16} strokeWidth={1.5} className="text-[#6B6B6B]" />
                  <span className="text-[13px] text-[#111]">Cash on Delivery</span>
                  <span className="text-[12px] text-[#6B6B6B] ml-auto tabular-nums">
                    {`Shipping ${optionLabel(quote?.cod)}`}
                  </span>
                </label>
              </div>

              <p className="text-[11px] text-[#6B6B6B] leading-relaxed mt-4">
                Shipping is calculated live and Viale covers half the courier cost. Free shipping on orders over {formatPrice(2999)}.
              </p>

              <div className="mt-5">
                <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">Order notes (optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2} placeholder="Anything we should know?"
                  className="w-full px-4 py-3 bg-white border border-[#E8E4DE] text-sm text-[#111] placeholder:text-[#B0ADA8] focus:outline-none focus:border-[#111] transition-colors resize-none"
                />
              </div>
            </section>
          </div>

          {/* ── Right: order summary ─────────────────────────────── */}
          <div className="lg:col-span-1">
            <div className="bg-white border border-[#E8E4DE] p-6 sticky top-28">
              <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111] mb-5">Your Order</h2>

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

              {/* Recipient — who & where the order goes to */}
              {selectedAddress && (
                <div className="mb-4 border border-[#F0EDE8] bg-[#FAFAF8] p-3">
                  <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1">Deliver to</p>
                  <p className="text-[12px] font-medium text-[#111]">{selectedAddress.full_name}</p>
                  {selectedAddress.phone && (
                    <p className="text-[12px] text-[#6B6B6B]">{selectedAddress.phone}</p>
                  )}
                  <p className="text-[11px] text-[#6B6B6B] leading-relaxed mt-1">{formatAddressLine(selectedAddress)}</p>
                </div>
              )}

              <div className="h-px bg-[#E8E4DE] my-4" />

              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between text-[#4A4A4A]">
                  <span>Subtotal</span><span className="tabular-nums">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-[#4A4A4A]">
                  <span>Shipping</span>
                  <span className="tabular-nums">
                    {!quote ? "—" : !selected?.available ? "—" : shippingCharge === 0 ? "Free" : formatPrice(shippingCharge)}
                  </span>
                </div>
              </div>

              <div className="h-px bg-[#E8E4DE] my-4" />

              <div className="flex justify-between items-baseline mb-6">
                <span className="text-[12px] tracking-[0.1em] uppercase text-[#111]">Total</span>
                <span className="text-2xl font-[family-name:var(--font-cormorant)] font-medium text-[#111] tabular-nums">
                  {formatPrice(total)}
                </span>
              </div>

              <button
                type="submit"
                disabled={!canPlace}
                className="w-full bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase py-4 hover:bg-[#333] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 size={14} className="animate-spin" /> : <Lock size={13} />}
                {isPending
                  ? "Processing…"
                  : method === "cod"
                    ? `Place Order · ${formatPrice(total)}`
                    : `Pay ${formatPrice(total)}`}
              </button>
              {!selectedAddress && (
                <p className="text-[11px] text-[#6B6B6B] text-center mt-3">Add a delivery address to continue.</p>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Address add/edit modal — shared with the account address book. */}
      {modalOpen && (
        <AddressFormModal
          key={editingAddress?.id ?? "new"}
          open={modalOpen}
          address={editingAddress}
          onClose={() => setModalOpen(false)}
          onSaved={() => router.refresh()}
        />
      )}

      {/* Payment recovery — failed / cancelled / resumable payment. Retrying
          reuses the same order, so no duplicate order is ever created. */}
      {recovery && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-5"
          role="dialog"
          aria-modal="true"
        >
          <div className="relative w-full max-w-sm bg-white border border-[#E8E4DE] p-7 text-center">
            <button
              type="button"
              onClick={dismissRecovery}
              aria-label="Close"
              className="absolute top-4 right-4 text-[#B0ADA8] hover:text-[#111] transition-colors"
            >
              <X size={18} />
            </button>

            <div
              className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-5 ${
                recovery.reason === "resume" ? "bg-[#F5F1EB]" : "bg-[#FBEAEA]"
              }`}
            >
              {recovery.reason === "resume" ? (
                <RefreshCw size={22} className="text-[#C9A86C]" />
              ) : (
                <AlertCircle size={22} className="text-[#B23A3A]" />
              )}
            </div>

            <h3 className="text-2xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111] mb-3">
              {recovery.reason === "resume"
                ? "Finish Your Payment"
                : recovery.reason === "cancelled"
                  ? "Payment Cancelled"
                  : "Payment Failed"}
            </h3>
            <p className="text-[13px] text-[#4A4A4A] leading-relaxed mb-6">
              {recovery.reason === "resume"
                ? "You have a payment that wasn't completed. You can pick up right where you left off — your order is saved."
                : recovery.reason === "cancelled"
                  ? "You closed the payment window before it was completed. You haven't been charged — you can try again whenever you're ready."
                  : `${recovery.detail ? `${recovery.detail} ` : "Your payment couldn't be completed. "}You haven't been charged. Please try again or use a different payment method.`}
            </p>

            <div className="space-y-3">
              <button
                type="button"
                onClick={resumePayment}
                disabled={isPending}
                className="w-full bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase py-3.5 hover:bg-[#333] transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
              >
                <RefreshCw size={13} />
                {recovery.reason === "resume" ? "Resume Payment" : "Try Again"}
              </button>
              <button
                type="button"
                onClick={dismissRecovery}
                className="w-full border border-[#E8E4DE] text-[#111] text-[11px] tracking-[0.2em] uppercase py-3.5 hover:border-[#111] transition-colors"
              >
                {recovery.reason === "resume" ? "Start Over" : "Choose Another Method"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
