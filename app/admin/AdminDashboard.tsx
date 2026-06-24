"use client";

import { useActionState, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  Ban,
  Bot,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Layers3,
  Package,
  PackagePlus,
  Pencil,
  Save,
  Search,
  ShoppingCart,
  Sparkles,
  Tags,
  UploadCloud,
} from "lucide-react";
import OrdersPanel, { type AdminOrder } from "./OrdersPanel";
import {
  approvePerfumeCandidateAdmin,
  createCollectionAdmin,
  createManualProductAdmin,
  discoverPerfumesAdmin,
  generatePerfumeImportAdmin,
  publishImportAdmin,
  rejectPerfumeCandidateAdmin,
  syncCatalogImagesAdmin,
  updateProductAdmin,
  type AdminActionState,
} from "@/app/actions/admin";
import { BOTTLE_SIZES, formatPrice, priceForSize } from "@/lib/product-utils";
import type {
  CollectionRow,
  PerfumeCandidateRow,
  PerfumeDiscoveryJobRow,
  PerfumeImportRow,
  ProductRow,
} from "@/types/database";

type TabId = "agent" | "products" | "collections" | "orders";

type Props = {
  role: "admin" | "owner";
  imports: PerfumeImportRow[];
  products: ProductRow[];
  collections: CollectionRow[];
  candidates: PerfumeCandidateRow[];
  jobs: PerfumeDiscoveryJobRow[];
  orders: AdminOrder[];
};

const initialActionState: AdminActionState = {};
const families = ["Fresh", "Floral", "Woody", "Oriental", "Gourmand", "Chypre"];
const genders = ["Men", "Women", "Unisex"];
const seasons = ["Spring", "Summer", "Autumn", "Winter"];
const categories = ["summer", "winter", "celebrity"];

// Candidate states that no longer need attention — kept out of the active queue
// so published/handled perfumes don't pile up next to fresh ones.
const RESOLVED_CANDIDATE_STATUSES = new Set(["enriched", "duplicate", "rejected"]);
// Import drafts that have left the queue (already a product, or discarded).
const CLOSED_IMPORT_STATUSES = new Set(["published", "rejected"]);

function SubmitButton({
  children,
  icon: Icon,
  variant = "dark",
}: {
  children: ReactNode;
  icon?: ComponentType<{ size?: number; className?: string }>;
  variant?: "dark" | "light";
}) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 text-xs font-semibold transition disabled:opacity-60 ${
        variant === "dark"
          ? "bg-[#111] text-white hover:bg-[#333]"
          : "border border-[#D8D1C8] bg-white text-[#111] hover:border-[#111]"
      }`}
    >
      {Icon && <Icon size={15} className={pending ? "animate-pulse" : ""} />}
      {pending ? "Working..." : children}
    </button>
  );
}

function Notice({ state }: { state: AdminActionState }) {
  if (!state.error && !state.message) return null;
  return (
    <div
      className={`rounded-md border px-3 py-2 text-sm ${
        state.error
          ? "border-red-200 bg-red-50 text-red-700"
          : "border-emerald-200 bg-emerald-50 text-emerald-700"
      }`}
    >
      {state.error ?? state.message}
    </div>
  );
}

function Label({ children }: { children: ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-[#6B6B6B]">
      {children}
    </label>
  );
}

function inputClass(className = "") {
  return `mt-1 w-full rounded-md border border-[#D8D1C8] bg-white px-3 py-2 text-sm text-[#111] outline-none transition focus:border-[#111] ${className}`;
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "published" || status === "enriched"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "failed" || status === "rejected"
        ? "border-red-200 bg-red-50 text-red-700"
        : status === "duplicate"
          ? "border-amber-200 bg-amber-50 text-amber-700"
          : "border-[#D8D1C8] bg-white text-[#6B6B6B]";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${tone}`}>
      {status}
    </span>
  );
}

function money(value: number | null | undefined) {
  return value == null ? "" : String(Number(value));
}

// Per-size price + discount inputs (5 / 10 / 30 ml). Emits price_5/discount_5 …
// fields parsed by parseSizePricing on the server. When editing an existing
// product, prefills any stored overrides and hints the multiplier price for the
// sizes that have none.
function SizePriceFields({ product }: { product?: ProductRow }) {
  const basePrice = Number(product?.price ?? 0);
  return (
    <div className="rounded-md border border-[#E8E4DE] bg-white p-3">
      <div className="grid grid-cols-[44px_1fr_1fr] items-center gap-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B6B6B]">
        <span>Size</span>
        <span>Price ₹</span>
        <span>Discount ₹</span>
      </div>
      <div className="space-y-2">
        {BOTTLE_SIZES.map((size) => {
          const entry = product?.size_pricing?.[String(size) as "5" | "10" | "30"];
          const priceValue =
            entry?.price != null ? entry.price : size === 5 ? product?.price ?? null : null;
          const discountValue =
            entry?.discount != null ? entry.discount : size === 5 ? product?.discount_price ?? null : null;
          const placeholder = basePrice > 0 ? String(priceForSize(basePrice, size)) : "0";
          return (
            <div key={size} className="grid grid-cols-[44px_1fr_1fr] items-center gap-2">
              <span className="text-sm font-semibold text-[#111]">{size}ml</span>
              <input
                name={`price_${size}`}
                type="number"
                min="0"
                step="1"
                required={size === 5}
                defaultValue={money(priceValue)}
                placeholder={size === 5 ? "required" : placeholder}
                className={inputClass("mt-0")}
              />
              <input
                name={`discount_${size}`}
                type="number"
                min="0"
                step="1"
                defaultValue={money(discountValue)}
                placeholder="none"
                className={inputClass("mt-0")}
              />
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[10px] leading-relaxed text-[#6B6B6B]">
        5ml price is required. Leave 10ml / 30ml blank to auto-price from the 5ml base.
      </p>
    </div>
  );
}

function candidatePreview(row: PerfumeImportRow) {
  return row.candidate as {
    imageSrc?: string;
    description?: string;
    notes?: string[];
    family?: string;
    gender?: string;
    seasons?: string[];
    import?: {
      confidence?: number;
      missingFields?: string[];
      sourceUrls?: string[];
      reviewSummary?: string;
    };
  };
}

function AgentPanel({
  imports,
  candidates,
  jobs,
}: {
  imports: PerfumeImportRow[];
  candidates: PerfumeCandidateRow[];
  jobs: PerfumeDiscoveryJobRow[];
}) {
  const [discoverState, discoverAction] = useActionState(discoverPerfumesAdmin, initialActionState);
  const [generateState, generateAction] = useActionState(generatePerfumeImportAdmin, initialActionState);

  const queueImports = imports.filter((row) => !CLOSED_IMPORT_STATUSES.has(row.status));
  const latestJob = jobs[0];
  const activeCandidates = candidates.filter((row) => !RESOLVED_CANDIDATE_STATUSES.has(row.status));
  const visibleCandidates = activeCandidates.slice(0, 24);
  const pendingCandidates = candidates.filter((row) => row.status === "candidate").length;
  const resolvedCount = candidates.length - activeCandidates.length;

  return (
    <div className="space-y-8">
      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="rounded-md border border-[#E8E4DE] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Search size={18} />
            <h2 className="text-lg font-semibold text-[#111]">Discovery</h2>
          </div>
          <form action={discoverAction} className="grid gap-4 sm:grid-cols-[1fr_1fr_120px_auto]">
            <div>
              <Label>Segment</Label>
              <select name="segment" defaultValue="mixed" className={inputClass()}>
                {["mixed", "popular", "designer", "niche", "indie"].map((segment) => (
                  <option key={segment} value={segment}>{segment}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Brand</Label>
              <input name="brand" placeholder="optional" className={inputClass()} />
            </div>
            <div>
              <Label>Limit</Label>
              <input name="limit" type="number" min="1" max="24" defaultValue="8" className={inputClass()} />
            </div>
            <div className="flex items-end">
              <SubmitButton icon={Search}>Queue</SubmitButton>
            </div>
          </form>
          <div className="mt-4">
            <Notice state={discoverState} />
          </div>
          {latestJob && (
            <div className="mt-4 rounded-md border border-[#E8E4DE] bg-[#FAFAF8] px-3 py-2 text-xs text-[#6B6B6B]">
              <p>Last job: {latestJob.status} · queued {latestJob.found_count} · skipped {latestJob.skipped_count}</p>
              {latestJob.error && (
                <p className="mt-1 text-red-700">{latestJob.error}</p>
              )}
            </div>
          )}
        </section>

        <section className="rounded-md border border-[#E8E4DE] bg-white p-5">
          <div className="mb-4 flex items-center gap-2">
            <Sparkles size={18} />
            <h2 className="text-lg font-semibold text-[#111]">Generate Draft</h2>
          </div>
          <form action={generateAction} className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label>Brand</Label>
              <input name="brand" required placeholder="Dior" className={inputClass()} />
            </div>
            <div>
              <Label>Perfume</Label>
              <input name="name" required placeholder="Sauvage Elixir" className={inputClass()} />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#111] sm:col-span-2">
              <input name="generate_image" type="checkbox" className="h-4 w-4 accent-[#111]" />
              Generate bottle image
            </label>
            <div className="sm:col-span-2">
              <SubmitButton icon={Sparkles}>Generate Draft</SubmitButton>
            </div>
          </form>
          <div className="mt-4">
            <Notice state={generateState} />
          </div>
        </section>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Search size={18} />
            <h2 className="text-lg font-semibold text-[#111]">Candidate Queue</h2>
          </div>
          <span className="text-xs text-[#6B6B6B]">
            {pendingCandidates} awaiting review
            {resolvedCount > 0 && ` · ${resolvedCount} resolved hidden`}
          </span>
        </div>

        <div className="grid gap-3">
          {visibleCandidates.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#D8D1C8] bg-white p-8 text-center text-sm text-[#6B6B6B]">
              No candidates awaiting review.
            </div>
          ) : visibleCandidates.map((candidate) => (
            <article key={candidate.id} className="rounded-md border border-[#E8E4DE] bg-white p-4">
              <div className="grid gap-4 lg:grid-cols-[1fr_320px] lg:items-start">
                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <StatusBadge status={candidate.status} />
                    <span className="rounded-full bg-[#F5F1EB] px-2 py-0.5 text-[10px] uppercase text-[#6B6B6B]">
                      {candidate.segment}
                    </span>
                    <span className="text-xs text-[#6B6B6B]">{candidate.created_at.slice(0, 10)}</span>
                  </div>
                  <h3 className="text-lg font-semibold text-[#111]">{candidate.brand} · {candidate.product_name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#6B6B6B]">{candidate.reason}</p>
                  {candidate.duplicate_reason && (
                    <p className="mt-2 text-xs text-red-700">{candidate.duplicate_reason}</p>
                  )}
                  {candidate.error && (
                    <p className="mt-2 text-xs text-red-700">{candidate.error}</p>
                  )}
                  {candidate.source_urls.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {candidate.source_urls.slice(0, 3).map((url, index) => (
                        <a
                          key={url}
                          href={url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-[#E8E4DE] px-2 py-0.5 text-[11px] text-[#6B6B6B] hover:border-[#111] hover:text-[#111]"
                        >
                          Source {index + 1}
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid gap-2 rounded-md bg-[#FAFAF8] p-3">
                  {candidate.status === "candidate" || candidate.status === "failed" ? (
                    <>
                      <form action={approvePerfumeCandidateAdmin} className="grid gap-3">
                        <input type="hidden" name="candidate_id" value={candidate.id} />
                        <input type="hidden" name="generate_image" value="false" />
                        <label className="flex items-center gap-2 text-sm text-[#111]">
                          <input name="generate_image" type="checkbox" defaultChecked className="h-4 w-4 accent-[#111]" />
                          Generate image
                        </label>
                        <SubmitButton icon={Sparkles}>
                          {candidate.status === "failed" ? "Retry Enrich" : "Approve & Enrich"}
                        </SubmitButton>
                      </form>
                      <form action={rejectPerfumeCandidateAdmin}>
                        <input type="hidden" name="candidate_id" value={candidate.id} />
                        <SubmitButton icon={Ban} variant="light">Reject</SubmitButton>
                      </form>
                    </>
                  ) : (
                    <div className="rounded-md border border-[#E8E4DE] bg-white px-3 py-2 text-sm text-[#6B6B6B]">
                      {candidate.status}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Package size={18} />
            <h2 className="text-lg font-semibold text-[#111]">Import Queue</h2>
          </div>
          <span className="text-xs text-[#6B6B6B]">{queueImports.length} pending</span>
        </div>

        <div className="grid gap-4">
          {queueImports.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#D8D1C8] bg-white p-8 text-center text-sm text-[#6B6B6B]">
              No drafts waiting to publish.
            </div>
          ) : queueImports.map((row) => {
            const candidate = candidatePreview(row);
            const imageSrc = candidate.imageSrc || row.image_path || "/collection_img.png";
            return (
              <article key={row.id} className="rounded-md border border-[#E8E4DE] bg-white p-4">
                <div className="grid gap-4 lg:grid-cols-[120px_1fr_360px]">
                  <div className="aspect-[3/4] overflow-hidden rounded-md bg-[#F5F1EB] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageSrc} alt={row.product_name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={row.status} />
                      {candidate.import?.confidence != null && (
                        <span className="text-xs text-[#6B6B6B]">
                          confidence {Math.round(candidate.import.confidence * 100)}%
                        </span>
                      )}
                    </div>
                    <h3 className="mt-2 text-xl font-semibold text-[#111]">{row.brand} · {row.product_name}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-[#6B6B6B]">
                      {candidate.description || "Draft generated by the perfume agent."}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {(candidate.notes ?? []).slice(0, 8).map((note) => (
                        <span key={note} className="rounded-full border border-[#E8E4DE] px-2 py-0.5 text-[11px] text-[#6B6B6B]">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                  <form action={publishImportAdmin} className="grid gap-3 rounded-md bg-[#FAFAF8] p-3">
                    <input type="hidden" name="import_id" value={row.id} />
                    <div>
                      <Label>Product id</Label>
                      <input name="product_id" defaultValue={row.product_slug} className={inputClass()} />
                    </div>
                    <div>
                      <Label>Size pricing</Label>
                      <div className="mt-1">
                        <SizePriceFields />
                      </div>
                    </div>
                    <div>
                      <Label>Tag</Label>
                      <input name="tag" placeholder="Bestseller" className={inputClass()} />
                    </div>
                    <label className="flex items-center gap-2 text-sm text-[#111]">
                      <input name="is_active" type="checkbox" className="h-4 w-4 accent-[#111]" />
                      Available on storefront
                    </label>
                    <SubmitButton icon={CheckCircle2}>Publish</SubmitButton>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function ProductRowEditor({ product }: { product: ProductRow }) {
  const [open, setOpen] = useState(false);
  const discountedSizes = product.size_pricing
    ? Object.values(product.size_pricing).filter((entry) => entry?.discount != null).length
    : product.discount_price != null
      ? 1
      : 0;

  return (
    <div className="px-4 py-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#111]">{product.brand} · {product.name}</p>
          <p className="truncate text-xs text-[#6B6B6B]">{product.id}</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-[#111]">{formatPrice(Number(product.price) || 0)}</p>
          <p className="text-[10px] uppercase tracking-[0.12em] text-[#6B6B6B]">
            5ml base{discountedSizes > 0 ? ` · ${discountedSizes} on sale` : ""}
          </p>
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
            product.is_active
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-[#D8D1C8] bg-white text-[#6B6B6B]"
          }`}
        >
          {product.is_active ? "Live" : "Hidden"}
        </span>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex items-center gap-1.5 rounded-md border border-[#D8D1C8] bg-white px-3 py-1.5 text-xs font-semibold text-[#111] transition hover:border-[#111]"
        >
          <Pencil size={13} />
          {open ? "Close" : "Edit"}
          {open ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {open && (
        <form action={updateProductAdmin} className="mt-4 grid gap-3 rounded-md bg-[#FAFAF8] p-4 lg:grid-cols-[1fr_240px]">
          <input type="hidden" name="product_id" value={product.id} />
          <SizePriceFields product={product} />
          <div className="grid content-start gap-3">
            <div>
              <Label>Tag</Label>
              <input name="tag" defaultValue={product.tag ?? ""} placeholder="Bestseller" className={inputClass()} />
            </div>
            <label className="flex items-center gap-2 text-sm text-[#111]">
              <input name="is_active" type="checkbox" defaultChecked={product.is_active} className="h-4 w-4 accent-[#111]" />
              Available on storefront
            </label>
            <SubmitButton icon={Save}>Save Changes</SubmitButton>
          </div>
        </form>
      )}
    </div>
  );
}

function ProductsPanel({ products }: { products: ProductRow[] }) {
  const [manualState, manualAction] = useActionState(createManualProductAdmin, initialActionState);
  const [syncState, syncAction] = useActionState(syncCatalogImagesAdmin, initialActionState);
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter((product) =>
      `${product.brand} ${product.name} ${product.id}`.toLowerCase().includes(q),
    );
  }, [products, query]);

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tags size={18} />
            <h2 className="text-lg font-semibold text-[#111]">Products</h2>
            <span className="text-xs text-[#6B6B6B]">{filtered.length} of {products.length}</span>
          </div>
          <form action={syncAction}>
            <SubmitButton icon={UploadCloud} variant="light">Sync Images</SubmitButton>
          </form>
        </div>

        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#9A938A]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products by name, brand, or id…"
            className="w-full rounded-md border border-[#D8D1C8] bg-white py-2.5 pl-9 pr-3 text-sm text-[#111] outline-none transition focus:border-[#111]"
          />
        </div>

        <Notice state={syncState} />

        <div className="overflow-hidden rounded-md border border-[#E8E4DE] bg-white">
          {filtered.length === 0 ? (
            <div className="p-8 text-center text-sm text-[#6B6B6B]">
              {products.length === 0 ? "No products yet." : "No products match your search."}
            </div>
          ) : (
            <div className="divide-y divide-[#E8E4DE]">
              {filtered.map((product) => (
                <ProductRowEditor key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="rounded-md border border-[#E8E4DE] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <PackagePlus size={18} />
          <h2 className="text-lg font-semibold text-[#111]">Manual Product</h2>
        </div>
        <form action={manualAction} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Brand</Label>
              <input name="brand" required className={inputClass()} />
            </div>
            <div>
              <Label>Name</Label>
              <input name="name" required className={inputClass()} />
            </div>
          </div>
          <div>
            <Label>Product id</Label>
            <input name="product_id" placeholder="optional-custom-slug" className={inputClass()} />
          </div>
          <div>
            <Label>Size pricing</Label>
            <div className="mt-1">
              <SizePriceFields />
            </div>
          </div>
          <div>
            <Label>Rating</Label>
            <input name="rating" type="number" min="0" max="5" step="0.1" defaultValue="4.5" className={inputClass()} />
          </div>
          <div>
            <Label>Image path</Label>
            <input name="image_path" placeholder="/collection_img.png" className={inputClass()} />
          </div>
          <div>
            <Label>Notes</Label>
            <textarea name="notes" required rows={2} placeholder="Bergamot, Jasmine, Cedar" className={inputClass()} />
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Family</Label>
              <select name="family" className={inputClass()}>
                {families.map((family) => <option key={family} value={family}>{family}</option>)}
              </select>
            </div>
            <div>
              <Label>Gender</Label>
              <select name="gender" defaultValue="Unisex" className={inputClass()}>
                {genders.map((gender) => <option key={gender} value={gender}>{gender}</option>)}
              </select>
            </div>
            <div>
              <Label>Tag</Label>
              <input name="tag" placeholder="New" className={inputClass()} />
            </div>
          </div>
          <div>
            <Label>Seasons</Label>
            <div className="mt-2 flex flex-wrap gap-3">
              {seasons.map((season) => (
                <label key={season} className="flex items-center gap-2 text-sm text-[#111]">
                  <input name="seasons" value={season} type="checkbox" defaultChecked={season === "Spring" || season === "Summer"} className="h-4 w-4 accent-[#111]" />
                  {season}
                </label>
              ))}
            </div>
          </div>
          <div>
            <Label>Short description</Label>
            <textarea name="description" required rows={2} className={inputClass()} />
          </div>
          <div>
            <Label>Long description</Label>
            <textarea name="long_description" rows={4} className={inputClass()} />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#111]">
            <input name="is_active" type="checkbox" defaultChecked className="h-4 w-4 accent-[#111]" />
            Available on storefront
          </label>
          <SubmitButton icon={PackagePlus}>Save Product</SubmitButton>
          <Notice state={manualState} />
        </form>
      </section>
    </div>
  );
}

function CollectionsPanel({ collections }: { collections: CollectionRow[] }) {
  const [collectionState, collectionAction] = useActionState(createCollectionAdmin, initialActionState);

  return (
    <div className="grid gap-8 xl:grid-cols-[420px_1fr]">
      <section className="rounded-md border border-[#E8E4DE] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Layers3 size={18} />
          <h2 className="text-lg font-semibold text-[#111]">Manual Collection</h2>
        </div>
        <form action={collectionAction} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Name</Label>
              <input name="name" required className={inputClass()} />
            </div>
            <div>
              <Label>Number</Label>
              <input name="number" required placeholder="01" className={inputClass()} />
            </div>
          </div>
          <div>
            <Label>Collection id</Label>
            <input name="collection_id" placeholder="optional-custom-slug" className={inputClass()} />
          </div>
          <div>
            <Label>Subtitle</Label>
            <input name="subtitle" required className={inputClass()} />
          </div>
          <div>
            <Label>Description</Label>
            <textarea name="description" required rows={3} className={inputClass()} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Bundle price</Label>
              <input name="bundle_price" required type="number" min="0" step="1" className={inputClass()} />
            </div>
            <div>
              <Label>Category</Label>
              <select name="season_category" className={inputClass()}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </div>
          </div>
          <div>
            <Label>Product ids</Label>
            <textarea name="product_ids" required rows={4} placeholder={"sauvage-dior\nbleu-chanel\nhacivat-nishane\nlibre-ysl"} className={inputClass()} />
          </div>
          <label className="flex items-center gap-2 text-sm text-[#111]">
            <input name="is_active" type="checkbox" defaultChecked className="h-4 w-4 accent-[#111]" />
            Available on storefront
          </label>
          <SubmitButton icon={Layers3}>Save Collection</SubmitButton>
          <Notice state={collectionState} />
        </form>
      </section>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Layers3 size={18} />
          <h2 className="text-lg font-semibold text-[#111]">Collections</h2>
        </div>
        <div className="grid gap-3">
          {collections.map((collection) => (
            <article key={collection.id} className="rounded-md border border-[#E8E4DE] bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-[#111]">
                    {collection.number} · {collection.name}
                  </p>
                  <p className="mt-1 text-xs text-[#6B6B6B]">{collection.subtitle}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-[#111]">{formatPrice(Number(collection.bundle_price))}</p>
                  <p className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B6B]">
                    {collection.is_active ? "active" : "hidden"}
                  </p>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

export default function AdminDashboard({ role, imports, products, collections, candidates, jobs, orders }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("agent");
  const stats = useMemo(() => {
    const activeProducts = products.filter((product) => product.is_active).length;
    const openOrders = orders.filter(
      (o) => o.status !== "delivered" && o.status !== "cancelled" && o.status !== "refunded",
    ).length;
    const pendingCandidates = candidates.filter((row) => row.status === "candidate").length;
    return [
      { label: "Products", value: products.length },
      { label: "Active", value: activeProducts },
      { label: "Open Orders", value: openOrders },
      { label: "Orders", value: orders.length },
      { label: "Candidates", value: pendingCandidates },
    ];
  }, [candidates, orders, products]);

  const tabs: { id: TabId; label: string; icon: ComponentType<{ size?: number }> }[] = [
    { id: "agent", label: "Agent", icon: Bot },
    { id: "products", label: "Products", icon: Tags },
    { id: "collections", label: "Collections", icon: Layers3 },
    { id: "orders", label: "Orders", icon: ShoppingCart },
  ];

  return (
    <main className="min-h-screen bg-[#FAFAF8] text-[#111]">
      <header className="border-b border-[#E8E4DE] bg-white">
        <div className="mx-auto flex max-w-screen-2xl flex-col gap-5 px-5 py-6 md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#C9A86C]">Viale Admin</p>
              <h1 className="mt-1 text-2xl font-semibold text-[#111]">Catalog Operations</h1>
            </div>
            <span className="rounded-full border border-[#D8D1C8] px-3 py-1 text-xs uppercase tracking-[0.12em] text-[#6B6B6B]">
              {role}
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-5">
            {stats.map((item) => (
              <div key={item.label} className="rounded-md border border-[#E8E4DE] bg-[#FAFAF8] px-4 py-3">
                <p className="text-2xl font-semibold text-[#111]">{item.value}</p>
                <p className="text-[11px] uppercase tracking-[0.12em] text-[#6B6B6B]">{item.label}</p>
              </div>
            ))}
          </div>
          <nav className="flex flex-wrap gap-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition ${
                    active
                      ? "border-[#111] bg-[#111] text-white"
                      : "border-[#D8D1C8] bg-white text-[#111] hover:border-[#111]"
                  }`}
                >
                  <Icon size={16} />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <div className="mx-auto max-w-screen-2xl px-5 py-8 md:px-8">
        {activeTab === "agent" && <AgentPanel imports={imports} candidates={candidates} jobs={jobs} />}
        {activeTab === "products" && <ProductsPanel products={products} />}
        {activeTab === "collections" && <CollectionsPanel collections={collections} />}
        {activeTab === "orders" && <OrdersPanel orders={orders} />}
      </div>
    </main>
  );
}
