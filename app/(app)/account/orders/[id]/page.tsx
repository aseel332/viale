import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CircleDot,
  Clock,
  Package,
  Truck,
} from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getStorefrontCollections, getStorefrontProducts } from "@/lib/catalog";
import { formatPrice } from "@/lib/product-utils";
import { DELIVERY_ESTIMATE } from "@/lib/shipping";
import type { OrderEventRow, OrderStatus, PaymentMethod, PaymentStatus, ShippingAddress } from "@/types/database";

export const metadata = { title: "Order — Viale" };

type RawItem = {
  product_id: string | null;
  collection_id: string | null;
  size_ml: number | null;
  quantity: number;
  unit_price: number;
};

function statusTone(status: string) {
  switch (status) {
    case "delivered":
    case "paid":
      return "bg-[#EAF4EA] text-[#3A7A3A]";
    case "shipped":
    case "processing":
      return "bg-blue-50 text-blue-700";
    case "cancelled":
    case "refunded":
      return "bg-red-50 text-red-700";
    default:
      return "bg-[#F1ECE4] text-[#6B6B6B]";
  }
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/account?redirectTo=/account/orders/${id}`);

  const { data: order } = await supabase
    .from("orders")
    .select(
      "id, status, payment_method, payment_status, total_amount, subtotal, shipping_charge, created_at, " +
        "shipping_address, courier_name, awb_code, tracking_url, " +
        "order_items(product_id, collection_id, size_ml, quantity, unit_price), " +
        "order_events(id, type, title, description, status, is_customer_visible, created_at)",
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!order) notFound();

  const o = order as unknown as {
    id: string;
    status: OrderStatus;
    payment_method: PaymentMethod | null;
    payment_status: PaymentStatus;
    total_amount: number;
    subtotal: number | null;
    shipping_charge: number | null;
    created_at: string;
    shipping_address: ShippingAddress | null;
    courier_name: string | null;
    awb_code: string | null;
    tracking_url: string | null;
    order_items: RawItem[] | null;
    order_events: OrderEventRow[] | null;
  };

  const [products, collections] = await Promise.all([
    getStorefrontProducts(),
    getStorefrontCollections(),
  ]);

  const items = (o.order_items ?? []).map((it) => {
    if (it.product_id) {
      const p = products.find((x) => x.id === it.product_id);
      return {
        label: p?.name ?? it.product_id,
        sub: `${p?.brand ?? ""}${it.size_ml ? ` · ${it.size_ml}ml` : ""}`.trim(),
        qty: it.quantity,
        lineTotal: Number(it.unit_price) * it.quantity,
        imageSrc: p?.imageSrc ?? "/collection_img.png",
      };
    }
    const c = collections.find((x) => x.id === it.collection_id);
    return {
      label: c?.name ?? "Collection",
      sub: "Collection · Box of 4",
      qty: it.quantity,
      lineTotal: Number(it.unit_price) * it.quantity,
      imageSrc: "/collection_img.png",
    };
  });

  const events = (o.order_events ?? [])
    .filter((e) => e.is_customer_visible)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const a = o.shipping_address;
  const isCod = o.payment_method === "cod";
  const isTerminal = o.status === "cancelled" || o.status === "refunded";

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-20">
      <div className="max-w-3xl mx-auto px-5 md:px-8">
        <Link href="/account?tab=orders" className="inline-flex items-center gap-2 text-[12px] text-[#6B6B6B] hover:text-[#111] mb-6">
          <ArrowLeft size={14} /> Back to orders
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-1">Order</p>
            <h1 className="text-3xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">
              #{o.id.slice(0, 8).toUpperCase()}
            </h1>
            <p className="text-[12px] text-[#6B6B6B] mt-1">
              Placed {new Date(o.created_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] capitalize ${statusTone(o.status)}`}>
            {o.status}
          </span>
        </div>

        {!isTerminal && (
          <div className="flex items-center gap-2 text-[13px] text-[#4A4A4A] bg-white border border-[#E8E4DE] px-4 py-3 mb-6">
            <Clock size={15} className="text-[#6B6B6B]" />
            Estimated delivery in {DELIVERY_ESTIMATE}
            {o.courier_name && <span className="text-[#6B6B6B]">· via {o.courier_name}</span>}
            {o.tracking_url && (
              <a href={o.tracking_url} target="_blank" rel="noreferrer" className="ml-auto inline-flex items-center gap-1 text-[#111] underline">
                <Truck size={14} /> Track{o.awb_code ? ` · ${o.awb_code}` : ""}
              </a>
            )}
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-[1fr_280px]">
          {/* Timeline */}
          <div className="bg-white border border-[#E8E4DE] p-6">
            <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111] mb-5">Updates</h2>
            {events.length === 0 ? (
              <p className="text-[13px] text-[#6B6B6B]">No updates yet. We&apos;ll keep you posted here.</p>
            ) : (
              <ol className="space-y-5">
                {events.map((e, idx) => {
                  const Icon = e.type === "shipment" ? Truck : e.type === "payment" ? Check : idx === 0 ? CircleDot : Package;
                  return (
                    <li key={e.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <span className={`flex h-7 w-7 items-center justify-center rounded-full ${idx === 0 ? "bg-[#111] text-white" : "bg-[#F1ECE4] text-[#6B6B6B]"}`}>
                          <Icon size={14} />
                        </span>
                        {idx < events.length - 1 && <span className="w-px flex-1 bg-[#E8E4DE] mt-1" />}
                      </div>
                      <div className="pb-1">
                        <p className="text-[13px] font-medium text-[#111]">{e.title}</p>
                        {e.description && <p className="text-[12px] text-[#4A4A4A] mt-0.5">{e.description}</p>}
                        <p className="text-[11px] text-[#9A9A9A] mt-1">
                          {new Date(e.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>

          {/* Summary */}
          <div className="space-y-6">
            <div className="bg-white border border-[#E8E4DE] p-5">
              <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111] mb-4">Payment</h2>
              <div className="space-y-1.5 text-[12px] text-[#4A4A4A]">
                <div className="flex justify-between"><span>Method</span><span className="text-[#111]">{isCod ? "Cash on Delivery" : "Online"}</span></div>
                <div className="flex justify-between"><span>Status</span><span className="text-[#111] capitalize">{o.payment_status}</span></div>
              </div>
              <div className="h-px bg-[#E8E4DE] my-3" />
              <div className="space-y-1.5 text-[12px] text-[#4A4A4A]">
                <div className="flex justify-between"><span>Subtotal</span><span className="tabular-nums">{o.subtotal != null ? formatPrice(Number(o.subtotal)) : "—"}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span className="tabular-nums">{o.shipping_charge != null ? (Number(o.shipping_charge) === 0 ? "Free" : formatPrice(Number(o.shipping_charge))) : "—"}</span></div>
                <div className="flex justify-between font-semibold text-[#111] pt-1"><span>Total</span><span className="tabular-nums">{formatPrice(Number(o.total_amount))}</span></div>
              </div>
            </div>

            {a && (
              <div className="bg-white border border-[#E8E4DE] p-5">
                <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111] mb-3">Shipping to</h2>
                <p className="text-[12px] text-[#4A4A4A] leading-relaxed">
                  {a.full_name}<br />
                  {[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}<br />
                  {a.city}, {a.state} {a.postal_code}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Items */}
        <div className="bg-white border border-[#E8E4DE] p-6 mt-6">
          <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111] mb-5">Items</h2>
          <div className="space-y-4">
            {items.map((it, i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-12 aspect-[3/4] bg-[#F5F1EB] flex-shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={it.imageSrc} alt={it.label} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#111] truncate">{it.label}</p>
                  <p className="text-[11px] text-[#6B6B6B]">{it.sub} · Qty {it.qty}</p>
                </div>
                <p className="text-[13px] font-medium text-[#111] tabular-nums">{formatPrice(it.lineTotal)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
