"use client";

import { useState, useActionState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  User, MapPin, CreditCard, Package, Heart, LogOut, Loader2, Trash2, Plus, Check, Pencil,
} from "lucide-react";
import { signOut } from "@/app/actions/auth";
import {
  updateContactInfo, addPaymentMethod, deletePaymentMethod, setDefaultPaymentMethod,
  removeFromWishlist, type ActionState,
} from "@/app/actions/account";
import { deleteAddress, setDefaultAddress } from "@/app/actions/addresses";
import type { AddressRow, PaymentMethodRow } from "@/types/database";
import { formatPrice } from "@/lib/product-utils";
import AddressFormModal from "@/components/account/AddressFormModal";

// ── Serializable shapes passed from the server page ───────────────────────────
export interface OrderView {
  id: string;
  status: string;
  total: number;
  createdAt: string;
  items: { label: string; sub: string; qty: number; lineTotal: number; imageSrc: string }[];
}
export interface WishlistView {
  productId: string;
  name: string;
  brand: string;
  price: number;
  imageSrc: string;
}

interface Props {
  email: string;
  fullName: string;
  phone: string;
  addresses: AddressRow[];
  cards: PaymentMethodRow[];
  orders: OrderView[];
  wishlist: WishlistView[];
  initialTab?: TabKey;
}

type TabKey = "profile" | "addresses" | "orders" | "payment" | "wishlist";

const TABS: { key: TabKey; label: string; icon: typeof User }[] = [
  { key: "profile",  label: "Profile",  icon: User },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "orders",   label: "Orders",   icon: Package },
  { key: "payment",  label: "Payment",  icon: CreditCard },
  { key: "wishlist", label: "Wishlist", icon: Heart },
];

const initialState: ActionState = {};

export default function AccountDashboard(props: Props) {
  const [tab, setTab] = useState<TabKey>(props.initialTab ?? "profile");
  const initials =
    (props.fullName || props.email).split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-20">
      <div className="max-w-screen-xl mx-auto px-5 md:px-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-[#111] text-white flex items-center justify-center text-sm font-medium">
              {initials}
            </div>
            <div>
              <h1 className="text-2xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111] leading-tight">
                {props.fullName || "Your Account"}
              </h1>
              <p className="text-[12px] text-[#6B6B6B]">{props.email}</p>
            </div>
          </div>
          <form action={signOut}>
            <button className="flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] hover:text-[#111] transition-colors">
              <LogOut size={14} /> <span className="hidden sm:inline">Sign Out</span>
            </button>
          </form>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar nav */}
          <aside className="lg:col-span-1">
            <nav className="flex lg:flex-col gap-1 overflow-x-auto scrollbar-none">
              {TABS.map((t) => {
                const active = tab === t.key;
                return (
                  <button
                    key={t.key}
                    onClick={() => setTab(t.key)}
                    className={`flex items-center gap-3 px-4 py-3 text-[12px] tracking-[0.08em] whitespace-nowrap transition-colors ${
                      active ? "bg-[#111] text-white" : "text-[#6B6B6B] hover:text-[#111] hover:bg-white"
                    }`}
                  >
                    <t.icon size={15} strokeWidth={1.5} />
                    {t.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          {/* Panel */}
          <div className="lg:col-span-3">
            {tab === "profile"  && <ProfilePanel {...props} />}
            {tab === "addresses" && <AddressesPanel addresses={props.addresses} />}
            {tab === "orders"   && <OrdersPanel orders={props.orders} />}
            {tab === "payment"  && <PaymentPanel cards={props.cards} />}
            {tab === "wishlist" && <WishlistPanel wishlist={props.wishlist} />}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Profile ───────────────────────────────────────────────────────────────────
function ProfilePanel({ fullName, phone, email }: Props) {
  const router = useRouter();
  const [state, setState] = useState<ActionState>({});
  const [isPending, startTransition] = useTransition();
  const [editing, setEditing] = useState(false);

  return (
    <div className="bg-white border border-[#E8E4DE] p-6 md:p-8">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111] mb-1">Profile</h2>
          <p className="text-[12px] text-[#6B6B6B]">Your account contact details.</p>
        </div>
        <button
          type="button"
          onClick={() => setEditing((value) => !value)}
          className="flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase text-[#111] hover:text-[#C9A86C] transition-colors"
        >
          <Pencil size={14} />
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      {state?.error && <Banner kind="error">{state.error}</Banner>}
      {state?.message && <Banner kind="success">{state.message}</Banner>}

      {!editing ? (
        <div className="grid gap-4 sm:grid-cols-2">
          <Info label="Full Name" value={fullName || "Not set"} />
          <Info label="Phone" value={phone || "Not set"} />
          <Info label="Email" value={email} className="sm:col-span-2" />
        </div>
      ) : (
        <form
          action={(fd) => startTransition(async () => {
            const result = await updateContactInfo({}, fd);
            setState(result);
            if (!result.error) {
              router.refresh();
              setEditing(false);
            }
          })}
          className="space-y-5"
        >
          <div className="grid grid-cols-2 gap-4">
            <LabeledInput label="Full Name" name="full_name" defaultValue={fullName} className="col-span-2" />
            <LabeledInput label="Phone" name="phone" type="tel" defaultValue={phone} placeholder="+91 98765 43210" className="col-span-2" />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-[#333] transition-colors disabled:opacity-60 flex items-center gap-2"
          >
            {isPending && <Loader2 size={14} className="animate-spin" />} Save Changes
          </button>
        </form>
      )}
    </div>
  );
}

// ── Addresses ─────────────────────────────────────────────────────────────────
function AddressesPanel({ addresses }: { addresses: AddressRow[] }) {
  const router = useRouter();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<AddressRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function openCreate() {
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(address: AddressRow) {
    setEditing(address);
    setModalOpen(true);
  }

  function remove(id: string) {
    setBusyId(id);
    startTransition(async () => {
      await deleteAddress(id);
      router.refresh();
      setBusyId(null);
    });
  }

  function makeDefault(id: string) {
    setBusyId(id);
    startTransition(async () => {
      await setDefaultAddress(id);
      router.refresh();
      setBusyId(null);
    });
  }

  return (
    <>
      <div className="bg-white border border-[#E8E4DE] p-6 md:p-8">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111] mb-1">Addresses</h2>
            <p className="text-[12px] text-[#6B6B6B]">Manage saved shipping addresses for checkout.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase text-[#111] hover:text-[#C9A86C] transition-colors"
          >
            <Plus size={14} /> Add Address
          </button>
        </div>

        {addresses.length === 0 ? (
          <div className="border border-dashed border-[#E8E4DE] p-10 text-center">
            <MapPin size={24} strokeWidth={1.2} className="mx-auto text-[#C9A86C] mb-3" />
            <p className="text-[13px] text-[#6B6B6B] mb-5">No saved addresses yet.</p>
            <button
              type="button"
              onClick={openCreate}
              className="inline-block bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-[#333] transition-colors"
            >
              Add Address
            </button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {addresses.map((address) => {
              const busy = busyId === address.id;
              return (
                <article key={address.id} className={`border border-[#E8E4DE] p-5 transition-opacity ${busy ? "opacity-50" : ""}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-[12px] font-semibold tracking-[0.08em] uppercase text-[#111]">{address.label}</p>
                        {address.is_default && (
                          <span className="text-[9px] tracking-[0.12em] uppercase text-[#C9A86C]">Default</span>
                        )}
                      </div>
                      <p className="text-[13px] font-medium text-[#111]">{address.full_name}</p>
                      <p className="text-[12px] text-[#6B6B6B] leading-relaxed mt-1">
                        {[
                          address.line1,
                          address.line2,
                          address.landmark ? `Landmark: ${address.landmark}` : "",
                          address.city,
                          address.state,
                          address.postal_code,
                          "India",
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                      {address.phone && <p className="text-[12px] text-[#6B6B6B] mt-1">{address.phone}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(address.id)}
                      disabled={busy}
                      className="text-[#B0ADA8] hover:text-[#111] transition-colors"
                      aria-label="Delete address"
                    >
                      <Trash2 size={15} strokeWidth={1.5} />
                    </button>
                  </div>

                  <div className="flex items-center gap-4 mt-5 pt-4 border-t border-[#F0EDE8]">
                    <button
                      type="button"
                      onClick={() => openEdit(address)}
                      className="text-[10px] tracking-[0.12em] uppercase text-[#111] hover:text-[#C9A86C] transition-colors"
                    >
                      Edit
                    </button>
                    {!address.is_default && (
                      <button
                        type="button"
                        onClick={() => makeDefault(address.id)}
                        disabled={busy}
                        className="text-[10px] tracking-[0.12em] uppercase text-[#6B6B6B] hover:text-[#111] transition-colors"
                      >
                        Make Default
                      </button>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>

      {modalOpen && (
        <AddressFormModal
          key={editing?.id ?? "new"}
          open={modalOpen}
          address={editing}
          onClose={() => setModalOpen(false)}
          onSaved={() => router.refresh()}
        />
      )}
    </>
  );
}

function Info({ label, value, className = "" }: { label: string; value: string; className?: string }) {
  return (
    <div className={`border border-[#E8E4DE] p-4 ${className}`}>
      <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-1">{label}</p>
      <p className="text-[14px] text-[#111]">{value}</p>
    </div>
  );
}

// ── Orders ──────────────────────────────────────────────────────────────────────
function OrdersPanel({ orders }: { orders: OrderView[] }) {
  if (orders.length === 0) {
    return (
      <EmptyState icon={Package} title="No orders yet" body="When you place an order, it'll show up here.">
        <Link href="/" className="inline-block bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-[#333] transition-colors">
          Start Shopping
        </Link>
      </EmptyState>
    );
  }

  const statusColor: Record<string, string> = {
    pending: "bg-[#FBF3E0] text-[#8B6A14]",
    paid: "bg-[#EAF4EA] text-[#2A5A2A]",
    processing: "bg-[#E6EFF7] text-[#1A4A78]",
    shipped: "bg-[#E6EFF7] text-[#1A4A78]",
    delivered: "bg-[#EAF4EA] text-[#2A5A2A]",
    cancelled: "bg-[#F7E6E6] text-[#8B1A1A]",
    refunded: "bg-[#F0EDE8] text-[#6B6B6B]",
  };

  return (
    <div className="space-y-4">
      {orders.map((order) => (
        <div key={order.id} className="bg-white border border-[#E8E4DE] p-6">
          <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-[#E8E4DE]">
            <div>
              <p className="text-[13px] font-medium text-[#111]">Order #{order.id.slice(0, 8).toUpperCase()}</p>
              <p className="text-[11px] text-[#6B6B6B]">
                {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-[9px] tracking-[0.15em] uppercase px-2.5 py-1 ${statusColor[order.status] ?? "bg-[#F0EDE8] text-[#6B6B6B]"}`}>
                {order.status}
              </span>
              <span className="text-[15px] font-semibold text-[#111] tabular-nums">{formatPrice(order.total)}</span>
            </div>
          </div>

          <div className="pt-4 space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex gap-3 items-center">
                <div className="w-11 aspect-[3/4] bg-[#F5F1EB] flex-shrink-0 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={item.imageSrc} alt={item.label} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-[#111] truncate">{item.label}</p>
                  <p className="text-[11px] text-[#6B6B6B]">{item.sub} · Qty {item.qty}</p>
                </div>
                <p className="text-[12px] text-[#111] tabular-nums">{formatPrice(item.lineTotal)}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Payment methods ────────────────────────────────────────────────────────────
function PaymentPanel({ cards }: { cards: PaymentMethodRow[] }) {
  const router = useRouter();
  const [state, formAction] = useActionState(addPaymentMethod, initialState);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const [formPending, startFormTransition] = useTransition();

  // Show the inline "add card" form when there are no saved cards, or when the
  // user opts in. Once the first card is saved, the refreshed `cards` prop
  // (cards.length > 0) collapses it automatically.
  const [addRequested, setAddRequested] = useState(false);
  const showForm = cards.length === 0 || addRequested;
  const setShowForm = setAddRequested;

  function remove(id: string) {
    setBusyId(id);
    startTransition(async () => {
      await deletePaymentMethod(id);
      router.refresh();
      setBusyId(null);
    });
  }
  function makeDefault(id: string) {
    setBusyId(id);
    startTransition(async () => {
      await setDefaultPaymentMethod(id);
      router.refresh();
      setBusyId(null);
    });
  }

  const thisYear = new Date().getFullYear();

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#E8E4DE] p-6 md:p-8">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111]">Payment Methods</h2>
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase text-[#111] hover:text-[#C9A86C] transition-colors"
            >
              <Plus size={14} /> Add Card
            </button>
          )}
        </div>
        <p className="text-[12px] text-[#6B6B6B] mb-6">
          Cards are stored for display only (brand, last 4, expiry). No full card number is ever saved.
        </p>

        {cards.length === 0 && !showForm && (
          <p className="text-[13px] text-[#6B6B6B] py-4">No saved cards yet.</p>
        )}

        <div className="space-y-3">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`flex items-center gap-3 p-4 border transition-opacity ${busyId === card.id ? "opacity-50" : ""} border-[#E8E4DE]`}
            >
              <CreditCard size={18} strokeWidth={1.5} className="text-[#6B6B6B]" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-[#111] font-medium">
                  {card.brand} ···· {card.last4}
                  {card.is_default && (
                    <span className="ml-2 text-[9px] tracking-[0.12em] uppercase text-[#C9A86C]">Default</span>
                  )}
                </p>
                <p className="text-[11px] text-[#6B6B6B]">
                  {card.cardholder_name} · Exp {String(card.exp_month).padStart(2, "0")}/{String(card.exp_year).slice(-2)}
                </p>
              </div>
              {!card.is_default && (
                <button
                  onClick={() => makeDefault(card.id)}
                  disabled={busyId === card.id}
                  className="text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B] hover:text-[#111] transition-colors"
                >
                  Make default
                </button>
              )}
              <button
                onClick={() => remove(card.id)}
                disabled={busyId === card.id}
                className="text-[#B0ADA8] hover:text-[#111] transition-colors"
                aria-label="Remove card"
              >
                <Trash2 size={15} strokeWidth={1.5} />
              </button>
            </div>
          ))}
        </div>

        {showForm && (
          <form action={(fd) => startFormTransition(() => formAction(fd))} className="mt-5 pt-5 border-t border-[#E8E4DE] space-y-4">
            {state?.error && <Banner kind="error">{state.error}</Banner>}
            <LabeledInput label="Cardholder Name" name="cardholder_name" placeholder="Jane Doe" />
            <LabeledInput label="Card Number" name="card_number" placeholder="4242 4242 4242 4242" inputMode="numeric" />
            <div className="grid grid-cols-2 gap-4">
              <LabeledInput label="Exp. Month (MM)" name="exp_month" placeholder="04" inputMode="numeric" />
              <LabeledInput label="Exp. Year (YYYY)" name="exp_year" placeholder={String(thisYear + 2)} inputMode="numeric" />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={formPending}
                className="bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-[#333] transition-colors disabled:opacity-60 flex items-center gap-2"
              >
                {formPending && <Loader2 size={14} className="animate-spin" />} Save Card
              </button>
              {cards.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="text-[11px] tracking-[0.15em] uppercase text-[#6B6B6B] hover:text-[#111] transition-colors px-4"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ── Wishlist ──────────────────────────────────────────────────────────────────────
function WishlistPanel({ wishlist }: { wishlist: WishlistView[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  if (wishlist.length === 0) {
    return (
      <EmptyState icon={Heart} title="Your wishlist is empty" body="Tap the heart on any fragrance to save it for later.">
        <Link href="/" className="inline-block bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase px-8 py-3.5 hover:bg-[#333] transition-colors">
          Browse Fragrances
        </Link>
      </EmptyState>
    );
  }

  function remove(productId: string) {
    setBusyId(productId);
    startTransition(async () => {
      await removeFromWishlist(productId);
      router.refresh();
      setBusyId(null);
    });
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {wishlist.map((w) => (
        <div key={w.productId} className={`bg-white border border-[#E8E4DE] transition-opacity ${busyId === w.productId ? "opacity-50" : ""}`}>
          <Link href={`/products/${w.productId}`} className="block aspect-[3/4] bg-[#F5F1EB] overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={w.imageSrc} alt={w.name} className="w-full h-full object-cover hover:scale-105 transition-transform duration-500" />
          </Link>
          <div className="p-3">
            <p className="text-[10px] tracking-[0.12em] uppercase text-[#6B6B6B]">{w.brand}</p>
            <p className="text-[13px] font-medium text-[#111] truncate">{w.name}</p>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[13px] font-semibold text-[#111]">{formatPrice(w.price)}</span>
              <button
                onClick={() => remove(w.productId)}
                disabled={busyId === w.productId}
                className="text-[#B0ADA8] hover:text-[#111] transition-colors"
                aria-label="Remove from wishlist"
              >
                <Trash2 size={14} strokeWidth={1.5} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Small shared bits ────────────────────────────────────────────────────────────
function LabeledInput({
  label, name, defaultValue, placeholder, type = "text", className = "", inputMode,
}: {
  label: string; name: string; defaultValue?: string | null; placeholder?: string;
  type?: string; className?: string; inputMode?: "numeric" | "text" | "tel";
}) {
  return (
    <div className={className}>
      <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">{label}</label>
      <input
        name={name}
        type={type}
        inputMode={inputMode}
        defaultValue={defaultValue ?? ""}
        placeholder={placeholder}
        className="w-full px-4 py-3 bg-white border border-[#E8E4DE] text-sm text-[#111] placeholder:text-[#B0ADA8] focus:outline-none focus:border-[#111] transition-colors"
      />
    </div>
  );
}

function Banner({ kind, children }: { kind: "error" | "success"; children: React.ReactNode }) {
  return (
    <div
      className={`mb-4 px-4 py-3 text-sm border flex items-center gap-2 ${
        kind === "error" ? "bg-red-50 border-red-200 text-red-700" : "bg-green-50 border-green-200 text-green-700"
      }`}
    >
      {kind === "success" && <Check size={15} />}
      {children}
    </div>
  );
}

function EmptyState({
  icon: Icon, title, body, children,
}: {
  icon: typeof Package; title: string; body: string; children: React.ReactNode;
}) {
  return (
    <div className="bg-white border border-[#E8E4DE] p-14 text-center">
      <Icon size={26} strokeWidth={1.2} className="mx-auto text-[#C9A86C] mb-4" />
      <p className="text-2xl font-[family-name:var(--font-cormorant)] italic text-[#111] mb-2">{title}</p>
      <p className="text-[13px] text-[#6B6B6B] mb-6">{body}</p>
      {children}
    </div>
  );
}
