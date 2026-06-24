"use client";

import { useActionState, useMemo, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { ChevronDown, ChevronUp, Search, Truck, RefreshCcw } from "lucide-react";
import {
  addOrderUpdateAdmin,
  cancelOrderAdmin,
  createShipmentAdmin,
  markCodPaidAdmin,
  refundOrderAdmin,
  updateOrderStatusAdmin,
  type OrderActionState,
} from "@/app/actions/orders-admin";
import { formatPrice } from "@/lib/product-utils";
import type { OrderStatus, PaymentMethod, PaymentStatus, ShippingAddress } from "@/types/database";

export type AdminOrderItem = { label: string; sub: string; qty: number; lineTotal: number };
export type AdminOrderEvent = {
  id: string;
  type: string;
  title: string;
  description: string | null;
  status: OrderStatus | null;
  isCustomerVisible: boolean;
  createdAt: string;
};
export type AdminOrder = {
  id: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod | null;
  paymentStatus: PaymentStatus;
  total: number;
  subtotal: number | null;
  shippingCharge: number | null;
  createdAt: string;
  contactEmail: string | null;
  contactPhone: string | null;
  address: ShippingAddress | null;
  courierName: string | null;
  awbCode: string | null;
  trackingUrl: string | null;
  labelUrl: string | null;
  items: AdminOrderItem[];
  events: AdminOrderEvent[];
};

const STATUS_FILTERS: (OrderStatus | "all")[] = [
  "all", "pending", "processing", "shipped", "delivered", "cancelled", "refunded",
];

function statusTone(status: string) {
  switch (status) {
    case "delivered":
    case "paid":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "shipped":
    case "processing":
      return "border-blue-200 bg-blue-50 text-blue-700";
    case "cancelled":
    case "refunded":
    case "failed":
      return "border-red-200 bg-red-50 text-red-700";
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    default:
      return "border-[#D8D1C8] bg-white text-[#6B6B6B]";
  }
}

function Badge({ children }: { children: ReactNode }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${statusTone(String(children))}`}>
      {children}
    </span>
  );
}

function SubmitButton({ children, variant = "dark", icon: Icon }: {
  children: ReactNode; variant?: "dark" | "light" | "danger"; icon?: React.ComponentType<{ size?: number; className?: string }>;
}) {
  const { pending } = useFormStatus();
  const cls =
    variant === "dark"
      ? "bg-[#111] text-white hover:bg-[#333]"
      : variant === "danger"
        ? "border border-red-300 bg-white text-red-700 hover:bg-red-50"
        : "border border-[#D8D1C8] bg-white text-[#111] hover:border-[#111]";
  return (
    <button type="submit" disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-3 py-1.5 text-xs font-semibold transition disabled:opacity-60 ${cls}`}>
      {Icon && <Icon size={14} className={pending ? "animate-pulse" : ""} />}
      {pending ? "Working…" : children}
    </button>
  );
}

function Notice({ state }: { state: OrderActionState }) {
  if (!state.error && !state.message) return null;
  return (
    <div className={`rounded-md border px-3 py-2 text-xs ${state.error ? "border-red-200 bg-red-50 text-red-700" : "border-emerald-200 bg-emerald-50 text-emerald-700"}`}>
      {state.error ?? state.message}
    </div>
  );
}

function StatusButton({ orderId, status, label }: { orderId: string; status: OrderStatus; label: string }) {
  return (
    <form action={updateOrderStatusAdmin}>
      <input type="hidden" name="order_id" value={orderId} />
      <input type="hidden" name="status" value={status} />
      <SubmitButton variant="light">{label}</SubmitButton>
    </form>
  );
}

function ShipmentForm({ order }: { order: AdminOrder }) {
  const [state, action] = useActionState(createShipmentAdmin, {} as OrderActionState);
  if (order.awbCode) {
    return (
      <div className="rounded-md border border-[#E8E4DE] bg-[#FAFAF8] p-3 text-xs text-[#4A4A4A]">
        <p className="font-semibold text-[#111]">Shipment created</p>
        <p className="mt-1">{order.courierName} · AWB {order.awbCode}</p>
        <div className="mt-2 flex gap-3">
          {order.trackingUrl && (
            <a href={order.trackingUrl} target="_blank" rel="noreferrer" className="text-[#111] underline">Track</a>
          )}
          {order.labelUrl && (
            <a href={order.labelUrl} target="_blank" rel="noreferrer" className="text-[#111] underline">Label</a>
          )}
        </div>
      </div>
    );
  }
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="order_id" value={order.id} />
      <Notice state={state} />
      <SubmitButton variant="dark" icon={Truck}>Create shipment (Shiprocket)</SubmitButton>
    </form>
  );
}

function RefundForm({ orderId }: { orderId: string }) {
  const [state, action] = useActionState(refundOrderAdmin, {} as OrderActionState);
  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="order_id" value={orderId} />
      <Notice state={state} />
      <SubmitButton variant="danger" icon={RefreshCcw}>Refund</SubmitButton>
    </form>
  );
}

function OrderRow({ order }: { order: AdminOrder }) {
  const [open, setOpen] = useState(false);
  const a = order.address;
  return (
    <div className="border-b border-[#E8E4DE]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left hover:bg-[#FAFAF8]"
      >
        <span className="font-mono text-xs text-[#6B6B6B]">#{order.id.slice(0, 8).toUpperCase()}</span>
        <span className="text-sm text-[#111]">{a?.full_name ?? "—"}</span>
        <Badge>{order.status}</Badge>
        <Badge>{order.paymentMethod === "cod" ? "COD" : "Online"}</Badge>
        <Badge>{order.paymentStatus}</Badge>
        <span className="ml-auto text-sm font-semibold tabular-nums text-[#111]">{formatPrice(order.total)}</span>
        <span className="text-[11px] text-[#6B6B6B]">{new Date(order.createdAt).toLocaleDateString()}</span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="grid gap-5 bg-[#FAFAF8] px-4 py-4 lg:grid-cols-[1fr_320px]">
          {/* Left: items, address, timeline */}
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">Items</p>
              <div className="divide-y divide-[#E8E4DE] rounded-md border border-[#E8E4DE] bg-white">
                {order.items.map((it, i) => (
                  <div key={i} className="flex items-center gap-3 px-3 py-2 text-sm">
                    <span className="text-[#111]">{it.label}</span>
                    <span className="text-[#6B6B6B]">{it.sub}</span>
                    <span className="ml-auto text-[#6B6B6B]">×{it.qty}</span>
                    <span className="w-20 text-right tabular-nums text-[#111]">{formatPrice(it.lineTotal)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-end gap-6 text-xs text-[#4A4A4A]">
                <span>Subtotal {order.subtotal != null ? formatPrice(order.subtotal) : "—"}</span>
                <span>Shipping {order.shippingCharge != null ? (order.shippingCharge === 0 ? "Free" : formatPrice(order.shippingCharge)) : "—"}</span>
                <span className="font-semibold text-[#111]">Total {formatPrice(order.total)}</span>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-md border border-[#E8E4DE] bg-white p-3 text-xs text-[#4A4A4A]">
                <p className="mb-1 font-semibold text-[#111]">Ship to</p>
                {a ? (
                  <p className="leading-relaxed">
                    {a.full_name}<br />
                    {[a.line1, a.line2, a.landmark].filter(Boolean).join(", ")}<br />
                    {a.city}, {a.state} {a.postal_code}
                  </p>
                ) : <p>No address.</p>}
              </div>
              <div className="rounded-md border border-[#E8E4DE] bg-white p-3 text-xs text-[#4A4A4A]">
                <p className="mb-1 font-semibold text-[#111]">Contact</p>
                <p>{order.contactEmail ?? "—"}</p>
                <p>{order.contactPhone ?? a?.phone ?? "—"}</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">Timeline</p>
              <div className="space-y-2">
                {order.events.length === 0 && <p className="text-xs text-[#6B6B6B]">No events yet.</p>}
                {order.events.map((e) => (
                  <div key={e.id} className="rounded-md border border-[#E8E4DE] bg-white px-3 py-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-[#111]">{e.title}</span>
                      {!e.isCustomerVisible && <span className="text-[10px] uppercase tracking-wide text-[#B0651B]">internal</span>}
                      <span className="ml-auto text-[#6B6B6B]">{new Date(e.createdAt).toLocaleString()}</span>
                    </div>
                    {e.description && <p className="mt-1 text-[#4A4A4A]">{e.description}</p>}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: actions */}
          <div className="space-y-4">
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">Status</p>
              <div className="flex flex-wrap gap-2">
                <StatusButton orderId={order.id} status="processing" label="Processing" />
                <StatusButton orderId={order.id} status="shipped" label="Shipped" />
                <StatusButton orderId={order.id} status="delivered" label="Delivered" />
                <form action={cancelOrderAdmin}>
                  <input type="hidden" name="order_id" value={order.id} />
                  <SubmitButton variant="danger">Cancel</SubmitButton>
                </form>
              </div>
            </div>

            <ShipmentForm order={order} />

            {order.paymentMethod === "cod" && order.paymentStatus !== "paid" && (
              <form action={markCodPaidAdmin}>
                <input type="hidden" name="order_id" value={order.id} />
                <SubmitButton variant="light">Mark COD paid</SubmitButton>
              </form>
            )}

            {order.paymentStatus === "paid" && <RefundForm orderId={order.id} />}

            <form action={addOrderUpdateAdmin} className="space-y-2 rounded-md border border-[#E8E4DE] bg-white p-3">
              <input type="hidden" name="order_id" value={order.id} />
              <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">Post update</p>
              <input name="title" required placeholder="Title (e.g. Out for delivery)"
                className="w-full rounded-md border border-[#D8D1C8] px-3 py-1.5 text-sm outline-none focus:border-[#111]" />
              <textarea name="description" rows={2} placeholder="Details (optional)"
                className="w-full resize-none rounded-md border border-[#D8D1C8] px-3 py-1.5 text-sm outline-none focus:border-[#111]" />
              <label className="flex items-center gap-2 text-xs text-[#4A4A4A]">
                <input type="checkbox" name="customer_visible" defaultChecked className="accent-[#111]" />
                Visible to customer
              </label>
              <SubmitButton variant="dark">Add update</SubmitButton>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function OrdersPanel({ orders }: { orders: AdminOrder[] }) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<OrderStatus | "all">("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        (o.address?.full_name ?? "").toLowerCase().includes(q) ||
        (o.contactEmail ?? "").toLowerCase().includes(q) ||
        (o.awbCode ?? "").toLowerCase().includes(q)
      );
    });
  }, [orders, query, statusFilter]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search id, name, email, AWB"
            className="w-72 rounded-md border border-[#D8D1C8] bg-white py-2 pl-9 pr-3 text-sm outline-none focus:border-[#111]"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`rounded-md border px-3 py-1.5 text-xs font-semibold capitalize transition ${
                statusFilter === s ? "border-[#111] bg-[#111] text-white" : "border-[#D8D1C8] bg-white text-[#111] hover:border-[#111]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs text-[#6B6B6B]">{filtered.length} orders</span>
      </div>

      <div className="overflow-hidden rounded-md border border-[#E8E4DE] bg-white">
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-[#6B6B6B]">No orders found.</p>
        ) : (
          filtered.map((order) => <OrderRow key={order.id} order={order} />)
        )}
      </div>
    </section>
  );
}
