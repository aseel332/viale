"use client";

import { useActionState, useMemo, useState, type ComponentType, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import {
  Ban,
  Bot,
  CheckCircle2,
  Layers3,
  Package,
  PackagePlus,
  Save,
  Search,
  Sparkles,
  Tags,
  UploadCloud,
} from "lucide-react";
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
import { formatPrice } from "@/lib/product-utils";
import type {
  CollectionRow,
  PerfumeCandidateRow,
  PerfumeDiscoveryJobRow,
  PerfumeImportRow,
  ProductRow,
} from "@/types/database";

type TabId = "agent" | "products" | "collections";

type Props = {
  role: "admin" | "owner";
  imports: PerfumeImportRow[];
  products: ProductRow[];
  collections: CollectionRow[];
  candidates: PerfumeCandidateRow[];
  jobs: PerfumeDiscoveryJobRow[];
};

const initialActionState: AdminActionState = {};
const families = ["Fresh", "Floral", "Woody", "Oriental", "Gourmand", "Chypre"];
const genders = ["Men", "Women", "Unisex"];
const seasons = ["Spring", "Summer", "Autumn", "Winter"];
const categories = ["summer", "winter", "celebrity"];

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
    status === "published"
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : status === "failed" || status === "rejected"
        ? "border-red-200 bg-red-50 text-red-700"
        : "border-[#D8D1C8] bg-white text-[#6B6B6B]";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${tone}`}>
      {status}
    </span>
  );
}

function money(value: number | null) {
  return value == null ? "" : String(Number(value));
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
  const pendingImports = imports.filter((row) => row.status !== "published");
  const latestJob = jobs[0];
  const visibleCandidates = candidates.filter((row) => row.status !== "rejected").slice(0, 24);
  const pendingCandidates = candidates.filter((row) => row.status === "candidate").length;

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
          <span className="text-xs text-[#6B6B6B]">{pendingCandidates} awaiting review</span>
        </div>

        <div className="grid gap-3">
          {visibleCandidates.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#D8D1C8] bg-white p-8 text-center text-sm text-[#6B6B6B]">
              No candidates queued.
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
                  ) : candidate.status === "enriched" ? (
                    <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                      Draft ready in import queue.
                    </div>
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
          <span className="text-xs text-[#6B6B6B]">{pendingImports.length} pending</span>
        </div>

        <div className="grid gap-4">
          {imports.length === 0 ? (
            <div className="rounded-md border border-dashed border-[#D8D1C8] bg-white p-8 text-center text-sm text-[#6B6B6B]">
              No import drafts yet.
            </div>
          ) : imports.map((row) => {
            const candidate = candidatePreview(row);
            const imageSrc = candidate.imageSrc || row.image_path || "/collection_img.png";
            return (
              <article key={row.id} className="rounded-md border border-[#E8E4DE] bg-white p-4">
                <div className="grid gap-4 lg:grid-cols-[120px_1fr_360px]">
                  <div className="aspect-square rounded-md bg-[#F5F1EB] p-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={imageSrc} alt={row.product_name} className="h-full w-full object-contain" />
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
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Price</Label>
                        <input name="price" required type="number" min="0" step="1" className={inputClass()} />
                      </div>
                      <div>
                        <Label>Discount</Label>
                        <input name="discount_price" type="number" min="0" step="1" className={inputClass()} />
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

function ProductsPanel({ products }: { products: ProductRow[] }) {
  const [manualState, manualAction] = useActionState(createManualProductAdmin, initialActionState);
  const [syncState, syncAction] = useActionState(syncCatalogImagesAdmin, initialActionState);

  return (
    <div className="grid gap-8 xl:grid-cols-[1fr_420px]">
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Tags size={18} />
            <h2 className="text-lg font-semibold text-[#111]">Products</h2>
          </div>
          <form action={syncAction}>
            <SubmitButton icon={UploadCloud} variant="light">Sync Images</SubmitButton>
          </form>
        </div>
        <Notice state={syncState} />
        <div className="overflow-hidden rounded-md border border-[#E8E4DE] bg-white">
          <div className="grid grid-cols-[1.2fr_0.8fr_110px_110px_120px_96px] gap-3 border-b border-[#E8E4DE] bg-[#FAFAF8] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#6B6B6B] max-lg:hidden">
            <span>Product</span>
            <span>Tag</span>
            <span>Price</span>
            <span>Discount</span>
            <span>Available</span>
            <span />
          </div>
          <div className="divide-y divide-[#E8E4DE]">
            {products.map((product) => (
              <form
                key={product.id}
                action={updateProductAdmin}
                className="grid gap-3 px-4 py-4 lg:grid-cols-[1.2fr_0.8fr_110px_110px_120px_96px] lg:items-center"
              >
                <input type="hidden" name="product_id" value={product.id} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-[#111]">{product.brand} · {product.name}</p>
                  <p className="truncate text-xs text-[#6B6B6B]">{product.id}</p>
                </div>
                <input name="tag" defaultValue={product.tag ?? ""} placeholder="Tag" className={inputClass("mt-0")} />
                <input name="price" type="number" min="0" step="1" defaultValue={money(product.price)} className={inputClass("mt-0")} />
                <input name="discount_price" type="number" min="0" step="1" defaultValue={money(product.discount_price)} className={inputClass("mt-0")} />
                <label className="flex items-center gap-2 text-sm text-[#111]">
                  <input name="is_active" type="checkbox" defaultChecked={product.is_active} className="h-4 w-4 accent-[#111]" />
                  {product.is_active ? "Yes" : "No"}
                </label>
                <SubmitButton icon={Save} variant="light">Save</SubmitButton>
              </form>
            ))}
          </div>
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
          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <Label>Price</Label>
              <input name="price" required type="number" min="0" step="1" className={inputClass()} />
            </div>
            <div>
              <Label>Discount</Label>
              <input name="discount_price" type="number" min="0" step="1" className={inputClass()} />
            </div>
            <div>
              <Label>Rating</Label>
              <input name="rating" type="number" min="0" max="5" step="0.1" defaultValue="4.5" className={inputClass()} />
            </div>
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

export default function AdminDashboard({ role, imports, products, collections, candidates, jobs }: Props) {
  const [activeTab, setActiveTab] = useState<TabId>("agent");
  const stats = useMemo(() => {
    const activeProducts = products.filter((product) => product.is_active).length;
    const discountedProducts = products.filter((product) => product.discount_price != null).length;
    const pendingCandidates = candidates.filter((row) => row.status === "candidate").length;
    return [
      { label: "Products", value: products.length },
      { label: "Active", value: activeProducts },
      { label: "Candidates", value: pendingCandidates },
      { label: "Drafts", value: imports.filter((row) => row.status !== "published").length },
      { label: "Discounted", value: discountedProducts },
    ];
  }, [candidates, imports, products]);

  const tabs: { id: TabId; label: string; icon: ComponentType<{ size?: number }> }[] = [
    { id: "agent", label: "Agent", icon: Bot },
    { id: "products", label: "Products", icon: Tags },
    { id: "collections", label: "Collections", icon: Layers3 },
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
      </div>
    </main>
  );
}
