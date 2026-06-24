// ─────────────────────────────────────────────────────────────────────────────
// Viale — Database Types
// Hand-written mirror of the Supabase schema (supabase/migrations/001_schema.sql).
// When you add/change a table, update both the SQL and this file.
//
// Tip: `supabase gen types typescript --project-id <ref>` can auto-generate
// this file from a live project. The hand-written version below serves as
// the source of truth during local development.
// ─────────────────────────────────────────────────────────────────────────────

// ── Shared enums ──────────────────────────────────────────────────────────────

export type FragranceFamily =
  | "Fresh"
  | "Floral"
  | "Woody"
  | "Oriental"
  | "Gourmand"
  | "Chypre";

export type Gender = "Men" | "Women" | "Unisex";

export type Season = "Spring" | "Summer" | "Autumn" | "Winter";

export type SeasonCategory = "summer" | "winter" | "celebrity";

export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

/** How the order is/was paid. */
export type PaymentMethod = "razorpay" | "cod";

/** Money state of the order, independent of fulfillment `status`. */
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

/** Event kinds on the order timeline. */
export type OrderEventType = "status_change" | "shipment" | "note" | "payment";

export type CartItemType = "product" | "collection";

/** Optional per-size price/discount override stored on products.size_pricing.
 *  Keys are ml as strings ("5" | "10" | "30"); every field is optional. */
export type SizePriceEntry = { price?: number | null; discount?: number | null };
export type SizePricingMap = Partial<Record<"5" | "10" | "30", SizePriceEntry>>;

// ── Row shapes (what the DB returns) ─────────────────────────────────────────

export type AdminUserRow = {
  user_id: string;
  role: "admin" | "owner";
  created_at: string;
};

export type ProfileRow = {
  id: string;                   // uuid — matches auth.users.id
  full_name: string | null;
  avatar_url: string | null;
  phone: string | null;
  created_at: string;
  updated_at: string;
};

export type AddressRow = {
  id: string;
  user_id: string;
  label: string;
  full_name: string;
  phone: string | null;
  line1: string;
  line2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type PaymentMethodRow = {
  id: string;
  user_id: string;
  brand: string;                // "Visa", "Mastercard", …
  last4: string;                // 4 digits
  exp_month: number;            // 1–12
  exp_year: number;
  cardholder_name: string;
  is_default: boolean;
  created_at: string;
};

export type PerfumeImportStatus = "draft" | "ready" | "failed" | "published" | "rejected";
export type PerfumeDiscoveryJobStatus = "queued" | "running" | "complete" | "failed";
export type PerfumeCandidateStatus =
  | "candidate"
  | "approved"
  | "rejected"
  | "enriched"
  | "duplicate"
  | "failed";

export type PerfumeDiscoverySegment = "popular" | "niche" | "designer" | "indie" | "mixed";

export type PerfumeImportRow = {
  id: string;
  created_by: string | null;
  status: PerfumeImportStatus;
  query: string;
  brand: string;
  product_name: string;
  product_slug: string;
  candidate: Record<string, unknown>;
  sources: Array<Record<string, unknown>>;
  image_path: string | null;
  image_prompt: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type PerfumeDiscoveryJobRow = {
  id: string;
  created_by: string | null;
  status: PerfumeDiscoveryJobStatus;
  segment: PerfumeDiscoverySegment;
  brand: string | null;
  target_count: number;
  found_count: number;
  skipped_count: number;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type PerfumeCandidateRow = {
  id: string;
  job_id: string | null;
  created_by: string | null;
  status: PerfumeCandidateStatus;
  brand: string;
  product_name: string;
  product_slug: string;
  segment: PerfumeDiscoverySegment;
  reason: string;
  source_urls: string[];
  duplicate_reason: string | null;
  import_id: string | null;
  error: string | null;
  created_at: string;
  updated_at: string;
};

export type ProductRow = {
  id: string;                   // slug e.g. "sauvage-dior"
  name: string;
  brand: string;
  price: number;
  discount_price: number | null;
  size_pricing: SizePricingMap | null;  // optional per-size overrides; null → multiplier model
  rating: number;
  image_path: string;           // Supabase Storage path
  tag: string | null;           // "Bestseller" | "Top Pick" | "Iconic" | null
  notes: string[];
  family: FragranceFamily;
  gender: Gender;
  seasons: Season[];
  description: string;
  long_description: string;
  bottle_sizes: number[];       // available ml sizes e.g. [5, 10, 30]
  weight_g: number;             // per-unit shipping weight in grams
  is_active: boolean;
  source_import_id: string | null;
  created_at: string;
  updated_at: string;
};

export type CollectionRow = {
  id: string;                   // slug e.g. "summer-01"
  number: string;               // "01", "02", …
  name: string;
  subtitle: string;
  description: string;
  bundle_price: number;
  season_category: SeasonCategory;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type CollectionItemRow = {
  id: string;
  collection_id: string;
  product_id: string;
  sort_order: number;           // 1–4
  created_at: string;
};

/** Snapshot of the chosen Shiprocket courier stored on orders.shipping_quote. */
export type ShippingQuoteSnapshot = {
  courier_name: string;
  base_rate: number;      // cheapest courier's full rate (₹)
  charged: number;        // what the customer pays (50% of base_rate, or 0 if free)
  etd_days: number | null;
  cod: boolean;
};

export type OrderRow = {
  id: string;
  user_id: string;
  status: OrderStatus;
  total_amount: number;
  shipping_address: ShippingAddress | null;
  notes: string | null;
  // payment
  payment_method: PaymentMethod | null;
  payment_status: PaymentStatus;
  razorpay_order_id: string | null;
  razorpay_payment_id: string | null;
  // money breakdown
  subtotal: number | null;
  shipping_charge: number | null;
  shipping_quote: ShippingQuoteSnapshot | null;
  // fulfillment / courier
  shiprocket_order_id: string | null;
  shiprocket_shipment_id: string | null;
  awb_code: string | null;
  courier_name: string | null;
  tracking_url: string | null;
  label_url: string | null;
  // contact (for courier + notifications)
  contact_email: string | null;
  contact_phone: string | null;
  created_at: string;
  updated_at: string;
};

export type OrderEventRow = {
  id: string;
  order_id: string;
  type: OrderEventType;
  title: string;
  description: string | null;
  status: OrderStatus | null;
  is_customer_visible: boolean;
  created_by: string | null;     // admin user id; null = system/webhook
  created_at: string;
};

export type OrderItemRow = {
  id: string;
  order_id: string;
  product_id: string | null;
  collection_id: string | null;
  size_ml: number | null;
  quantity: number;
  unit_price: number;           // price at time of purchase
  created_at: string;
};

export type CartItemRow = {
  id: string;
  user_id: string;
  item_type: CartItemType;
  product_id: string | null;
  collection_id: string | null;
  size_ml: number | null;       // 5 | 10 | 30 — null for collection items
  quantity: number;
  created_at: string;
  updated_at: string;
};

export type WishlistItemRow = {
  id: string;
  user_id: string;
  product_id: string;
  created_at: string;
};

export type ReviewRow = {
  id: string;
  user_id: string;
  product_id: string;
  rating: number;               // 1–5
  title: string | null;
  body: string | null;
  is_verified_purchase: boolean;
  created_at: string;
  updated_at: string;
};

// ── Insert shapes (what you send to the DB) ───────────────────────────────────

export type ProfileInsert = Omit<ProfileRow, "created_at" | "updated_at">;
export type AdminUserInsert = Omit<AdminUserRow, "created_at">;
export type AddressInsert = Omit<AddressRow, "id" | "created_at" | "updated_at">;
export type PaymentMethodInsert = Omit<PaymentMethodRow, "id" | "created_at">;
export type PerfumeImportInsert = Omit<PerfumeImportRow, "id" | "created_at" | "updated_at">;
export type PerfumeDiscoveryJobInsert = Omit<PerfumeDiscoveryJobRow, "id" | "created_at" | "updated_at">;
export type PerfumeCandidateInsert = Omit<PerfumeCandidateRow, "id" | "created_at" | "updated_at">;
export type ProductInsert =
  Omit<ProductRow, "created_at" | "updated_at" | "weight_g"> &
  Partial<Pick<ProductRow, "weight_g">>;
export type CollectionInsert = Omit<CollectionRow, "created_at" | "updated_at">;
export type CollectionItemInsert = Omit<CollectionItemRow, "id" | "created_at">;
// New payment/fulfillment columns all have DB defaults or are nullable, so they
// are optional at insert time; only the original core fields are required.
type OrderInsertOptional =
  | "payment_method"
  | "payment_status"
  | "razorpay_order_id"
  | "razorpay_payment_id"
  | "subtotal"
  | "shipping_charge"
  | "shipping_quote"
  | "shiprocket_order_id"
  | "shiprocket_shipment_id"
  | "awb_code"
  | "courier_name"
  | "tracking_url"
  | "label_url"
  | "contact_email"
  | "contact_phone";
export type OrderInsert =
  Omit<OrderRow, "id" | "created_at" | "updated_at" | OrderInsertOptional> &
  Partial<Pick<OrderRow, OrderInsertOptional>>;
export type OrderItemInsert = Omit<OrderItemRow, "id" | "created_at">;
export type OrderEventInsert =
  Omit<OrderEventRow, "id" | "created_at" | "status" | "description" | "is_customer_visible" | "created_by"> &
  Partial<Pick<OrderEventRow, "status" | "description" | "is_customer_visible" | "created_by">>;
export type OrderUpdate = Partial<Omit<OrderRow, "id" | "user_id" | "created_at" | "updated_at">>;
export type CartItemInsert = Omit<CartItemRow, "id" | "created_at" | "updated_at">;
export type WishlistItemInsert = Omit<WishlistItemRow, "id" | "created_at">;
export type ReviewInsert =
  Omit<ReviewRow, "id" | "created_at" | "updated_at" | "is_verified_purchase"> &
  { is_verified_purchase?: boolean };

// ── Update shapes ─────────────────────────────────────────────────────────────

export type ProfileUpdate = Partial<Omit<ProfileRow, "id" | "created_at">>;
export type AdminUserUpdate = Partial<Omit<AdminUserRow, "user_id" | "created_at">>;
export type AddressUpdate = Partial<Omit<AddressRow, "id" | "user_id" | "created_at" | "updated_at">>;
export type PaymentMethodUpdate = Partial<Omit<PaymentMethodRow, "id" | "user_id" | "created_at">>;
export type PerfumeImportUpdate = Partial<Omit<PerfumeImportRow, "id" | "created_at" | "updated_at">>;
export type PerfumeDiscoveryJobUpdate = Partial<Omit<PerfumeDiscoveryJobRow, "id" | "created_at" | "updated_at">>;
export type PerfumeCandidateUpdate = Partial<Omit<PerfumeCandidateRow, "id" | "created_at" | "updated_at">>;
export type ProductUpdate = Partial<Omit<ProductRow, "id" | "created_at">>;
export type CartItemUpdate = Pick<CartItemRow, "quantity">;
export type ReviewUpdate = Partial<Pick<ReviewRow, "rating" | "title" | "body">>;

// ── Nested / joined shapes ────────────────────────────────────────────────────

/** Collection with its 4 items eagerly loaded */
export type CollectionWithItems = CollectionRow & {
  collection_items: (CollectionItemRow & { product: ProductRow })[];
};

/** Order with its line items */
export type OrderWithItems = OrderRow & {
  order_items: (OrderItemRow & {
    product: ProductRow | null;
    collection: CollectionRow | null;
  })[];
};

/** Order with line items and its event timeline (admin + order detail views) */
export type OrderWithDetails = OrderWithItems & {
  order_events: OrderEventRow[];
};

/** Cart item with resolved product/collection */
export type CartItemResolved = CartItemRow & {
  product: ProductRow | null;
  collection: CollectionRow | null;
};

/** Review with author profile */
export type ReviewWithProfile = ReviewRow & {
  profile: Pick<ProfileRow, "full_name" | "avatar_url">;
};

// ── Misc shared types ─────────────────────────────────────────────────────────

export type ShippingAddress = {
  full_name: string;
  phone?: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  postal_code: string;
  country: "IN";              // Viale currently ships within India only
};

// ── Supabase Database generic (used to type createClient<Database>) ───────────
// Each table entry must include `Relationships` to satisfy GenericTable.

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: AdminUserRow;
        Insert: AdminUserInsert;
        Update: AdminUserUpdate;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      addresses: {
        Row: AddressRow;
        Insert: AddressInsert;
        Update: AddressUpdate;
        Relationships: [];
      };
      payment_methods: {
        Row: PaymentMethodRow;
        Insert: PaymentMethodInsert;
        Update: PaymentMethodUpdate;
        Relationships: [];
      };
      perfume_imports: {
        Row: PerfumeImportRow;
        Insert: PerfumeImportInsert;
        Update: PerfumeImportUpdate;
        Relationships: [];
      };
      perfume_discovery_jobs: {
        Row: PerfumeDiscoveryJobRow;
        Insert: PerfumeDiscoveryJobInsert;
        Update: PerfumeDiscoveryJobUpdate;
        Relationships: [];
      };
      perfume_candidates: {
        Row: PerfumeCandidateRow;
        Insert: PerfumeCandidateInsert;
        Update: PerfumeCandidateUpdate;
        Relationships: [];
      };
      products: {
        Row: ProductRow;
        Insert: ProductInsert;
        Update: ProductUpdate;
        Relationships: [];
      };
      collections: {
        Row: CollectionRow;
        Insert: CollectionInsert;
        Update: Partial<Omit<CollectionRow, "id" | "created_at">>;
        Relationships: [];
      };
      collection_items: {
        Row: CollectionItemRow;
        Insert: CollectionItemInsert;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      orders: {
        Row: OrderRow;
        Insert: OrderInsert;
        Update: OrderUpdate;
        Relationships: [];
      };
      order_items: {
        Row: OrderItemRow;
        Insert: OrderItemInsert;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      order_events: {
        Row: OrderEventRow;
        Insert: OrderEventInsert;
        Update: Partial<Omit<OrderEventRow, "id" | "order_id" | "created_at">>;
        Relationships: [];
      };
      cart_items: {
        Row: CartItemRow;
        Insert: CartItemInsert;
        Update: CartItemUpdate;
        Relationships: [];
      };
      wishlist_items: {
        Row: WishlistItemRow;
        Insert: WishlistItemInsert;
        Update: Record<string, unknown>;
        Relationships: [];
      };
      reviews: {
        Row: ReviewRow;
        Insert: ReviewInsert;
        Update: ReviewUpdate;
        Relationships: [];
      };
    };
    Views: Record<never, never>;         // no views yet
    Functions: Record<never, never>;     // no RPC functions yet
    Enums: {
      fragrance_family: FragranceFamily;
      gender: Gender;
      season: Season;
      season_category: SeasonCategory;
      order_status: OrderStatus;
      cart_item_type: CartItemType;
    };
  };
}
