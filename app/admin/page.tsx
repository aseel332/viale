import AdminDashboard from "./AdminDashboard";
import type { AdminOrder } from "./OrdersPanel";
import { requireAdminPage } from "@/lib/admin/auth";
import { getStorefrontCollections, getStorefrontProducts } from "@/lib/catalog";
import type {
  CollectionRow,
  OrderEventRow,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  PerfumeCandidateRow,
  PerfumeDiscoveryJobRow,
  PerfumeImportRow,
  ProductRow,
  ShippingAddress,
} from "@/types/database";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Viale" };

// The hand-written DB types declare empty Relationships, so embedded selects
// aren't statically typed — describe the runtime shape we read below.
type RawOrderItem = {
  product_id: string | null;
  collection_id: string | null;
  size_ml: number | null;
  quantity: number;
  unit_price: number;
};
type RawOrder = {
  id: string;
  status: OrderStatus;
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  total_amount: number;
  subtotal: number | null;
  shipping_charge: number | null;
  created_at: string;
  contact_email: string | null;
  contact_phone: string | null;
  shipping_address: ShippingAddress | null;
  courier_name: string | null;
  awb_code: string | null;
  tracking_url: string | null;
  label_url: string | null;
  order_items: RawOrderItem[] | null;
  order_events: OrderEventRow[] | null;
};

export default async function AdminPage() {
  const { supabase, admin } = await requireAdminPage();

  const [importsResult, productsResult, collectionsResult, candidatesResult, jobsResult, ordersResult, catalogProducts, catalogCollections] =
    await Promise.all([
      supabase.from("perfume_imports").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("products").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("collections").select("*").order("created_at", { ascending: false }).limit(50),
      supabase.from("perfume_candidates").select("*").order("created_at", { ascending: false }).limit(100),
      supabase.from("perfume_discovery_jobs").select("*").order("created_at", { ascending: false }).limit(20),
      supabase
        .from("orders")
        .select(
          "id, status, payment_method, payment_status, total_amount, subtotal, shipping_charge, created_at, contact_email, contact_phone, shipping_address, courier_name, awb_code, tracking_url, label_url, " +
            "order_items(product_id, collection_id, size_ml, quantity, unit_price), " +
            "order_events(id, type, title, description, status, is_customer_visible, created_at)",
        )
        .order("created_at", { ascending: false })
        .limit(100),
      getStorefrontProducts(),
      getStorefrontCollections(),
    ]);

  if (importsResult.error) throw new Error(importsResult.error.message);
  if (productsResult.error) throw new Error(productsResult.error.message);
  if (collectionsResult.error) throw new Error(collectionsResult.error.message);
  if (candidatesResult.error) throw new Error(candidatesResult.error.message);
  if (jobsResult.error) throw new Error(jobsResult.error.message);
  if (ordersResult.error) throw new Error(ordersResult.error.message);

  const productName = (id: string) => {
    const p = catalogProducts.find((x) => x.id === id);
    return { label: p?.name ?? id, brand: p?.brand ?? "" };
  };
  const collectionName = (id: string) => catalogCollections.find((x) => x.id === id)?.name ?? "Collection";

  const rawOrders = (ordersResult.data ?? []) as unknown as RawOrder[];
  const orders: AdminOrder[] = rawOrders.map((o) => ({
    id: o.id,
    status: o.status,
    paymentMethod: o.payment_method,
    paymentStatus: o.payment_status,
    total: Number(o.total_amount),
    subtotal: o.subtotal != null ? Number(o.subtotal) : null,
    shippingCharge: o.shipping_charge != null ? Number(o.shipping_charge) : null,
    createdAt: o.created_at,
    contactEmail: o.contact_email,
    contactPhone: o.contact_phone,
    address: o.shipping_address,
    courierName: o.courier_name,
    awbCode: o.awb_code,
    trackingUrl: o.tracking_url,
    labelUrl: o.label_url,
    items: (o.order_items ?? []).map((it) => {
      if (it.product_id) {
        const p = productName(it.product_id);
        return {
          label: p.label,
          sub: `${p.brand}${it.size_ml ? ` · ${it.size_ml}ml` : ""}`.trim(),
          qty: it.quantity,
          lineTotal: Number(it.unit_price) * it.quantity,
        };
      }
      return {
        label: collectionName(it.collection_id ?? ""),
        sub: "Collection · Box of 4",
        qty: it.quantity,
        lineTotal: Number(it.unit_price) * it.quantity,
      };
    }),
    events: (o.order_events ?? [])
      .slice()
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map((e) => ({
        id: e.id,
        type: e.type,
        title: e.title,
        description: e.description,
        status: e.status,
        isCustomerVisible: e.is_customer_visible,
        createdAt: e.created_at,
      })),
  }));

  return (
    <AdminDashboard
      role={admin.role}
      imports={(importsResult.data ?? []) as PerfumeImportRow[]}
      products={(productsResult.data ?? []) as ProductRow[]}
      collections={(collectionsResult.data ?? []) as CollectionRow[]}
      candidates={(candidatesResult.data ?? []) as PerfumeCandidateRow[]}
      jobs={(jobsResult.data ?? []) as PerfumeDiscoveryJobRow[]}
      orders={orders}
    />
  );
}
