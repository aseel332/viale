import { createClient } from "@/lib/supabase/server";
import { getStorefrontCollections, getStorefrontProducts } from "@/lib/catalog";
import type { AddressRow, PaymentMethodRow } from "@/types/database";
import AuthPanel from "./AuthPanel";
import AccountDashboard, { type OrderView, type WishlistView } from "./AccountDashboard";

export const metadata = { title: "Account — Viale" };

type TabKey = "profile" | "addresses" | "orders" | "payment" | "wishlist";
const VALID_TABS: TabKey[] = ["profile", "addresses", "orders", "payment", "wishlist"];

export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string; error?: string; tab?: string }>;
}) {
  const { redirectTo, error, tab } = await searchParams;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // ── Not signed in → auth panel ──────────────────────────────────────────────
  if (!user) {
    return <AuthPanel redirectTo={redirectTo} oauthError={error} />;
  }

  // ── Signed in → fetch everything for the dashboard ──────────────────────────
  const [
    { data: profile },
    { data: addresses },
    { data: cards },
    { data: orderRows },
    { data: wishRows },
    products,
    collections,
  ] =
    await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("id", user.id).maybeSingle(),
      supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at", { ascending: true }),
      supabase.from("payment_methods").select("*").eq("user_id", user.id).order("is_default", { ascending: false }).order("created_at", { ascending: false }),
      supabase
        .from("orders")
        .select("id, status, total_amount, created_at, order_items(product_id, collection_id, size_ml, quantity, unit_price)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false }),
      supabase.from("wishlist_items").select("product_id, created_at").eq("user_id", user.id).order("created_at", { ascending: false }),
      getStorefrontProducts(),
      getStorefrontCollections(),
    ]);

  // Resolve orders into display views.
  // The hand-written DB types declare empty Relationships, so the embedded
  // `order_items(...)` select isn't statically typed — cast to the known shape.
  type ItemRow = { product_id: string | null; collection_id: string | null; size_ml: number | null; quantity: number; unit_price: number };
  type RawOrder = { id: string; status: string; total_amount: number; created_at: string; order_items: ItemRow[] | null };
  const rawOrders = (orderRows ?? []) as unknown as RawOrder[];

  const orders: OrderView[] = rawOrders.map((o) => {
    const itemsRaw = o.order_items ?? [];
    const items = itemsRaw.map((it) => {
      if (it.product_id) {
        const p = products.find((x) => x.id === it.product_id);
        return {
          label: p?.name ?? it.product_id,
          sub: `${p?.brand ?? ""}${it.size_ml ? ` · ${it.size_ml}ml` : ""}`.trim(),
          qty: it.quantity,
          lineTotal: it.unit_price * it.quantity,
          imageSrc: p?.imageSrc ?? "/collection_img.png",
        };
      }
      const c = collections.find((x) => x.id === it.collection_id);
      return {
        label: c?.name ?? it.collection_id ?? "Collection",
        sub: "Collection · Box of 4",
        qty: it.quantity,
        lineTotal: it.unit_price * it.quantity,
        imageSrc: "/collection_img.png",
      };
    });
    return {
      id: o.id,
      status: o.status,
      total: Number(o.total_amount),
      createdAt: o.created_at,
      items,
    };
  });

  // Resolve wishlist
  const wishlist: WishlistView[] = (wishRows ?? [])
    .map((w) => {
      const p = products.find((x) => x.id === w.product_id);
      if (!p) return null;
      return { productId: p.id, name: p.name, brand: p.brand, price: p.price, imageSrc: p.imageSrc };
    })
    .filter((w): w is WishlistView => Boolean(w));

  const initialTab = (tab && VALID_TABS.includes(tab as TabKey) ? tab : "profile") as TabKey;

  return (
    <AccountDashboard
      email={user.email ?? ""}
      fullName={profile?.full_name ?? ""}
      phone={profile?.phone ?? ""}
      addresses={(addresses as AddressRow[] | null) ?? []}
      cards={(cards as PaymentMethodRow[] | null) ?? []}
      orders={orders}
      wishlist={wishlist}
      initialTab={initialTab}
    />
  );
}
