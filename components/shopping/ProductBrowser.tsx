"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";
import {
  PRODUCTS, DEFAULT_FILTERS, FilterState, SortOption, SORT_OPTIONS,
  filterAndSort, countActiveFilters,
} from "@/lib/products";
import FilterPanel from "./FilterPanel";
import ProductCard  from "./ProductCard";
import { AnimateIn }    from "@/components/AnimateIn";

interface Props {
  category?:   "all" | "men" | "women";
  maxVisible?: number;
}

// ── Active filter chips ────────────────────────────────────────
interface Chip { label: string; onRemove: () => void; }

function buildChips(
  filters: FilterState,
  setFilters: (f: FilterState) => void,
): Chip[] {
  const chips: Chip[] = [];

  filters.families.forEach((v) =>
    chips.push({
      label: v,
      onRemove: () =>
        setFilters({ ...filters, families: filters.families.filter((x) => x !== v) }),
    })
  );
  filters.notes.forEach((v) =>
    chips.push({
      label: v,
      onRemove: () =>
        setFilters({ ...filters, notes: filters.notes.filter((x) => x !== v) }),
    })
  );
  filters.brands.forEach((v) =>
    chips.push({
      label: v,
      onRemove: () =>
        setFilters({ ...filters, brands: filters.brands.filter((x) => x !== v) }),
    })
  );
  filters.genders.forEach((v) =>
    chips.push({
      label: v,
      onRemove: () =>
        setFilters({ ...filters, genders: filters.genders.filter((x) => x !== v) }),
    })
  );
  filters.seasons.forEach((v) =>
    chips.push({
      label: v,
      onRemove: () =>
        setFilters({ ...filters, seasons: filters.seasons.filter((x) => x !== v) }),
    })
  );
  if (filters.minRating > 0)
    chips.push({
      label: `★ ${filters.minRating}+`,
      onRemove: () => setFilters({ ...filters, minRating: 0 }),
    });

  return chips;
}

// ── Sort dropdown ──────────────────────────────────────────────
function SortDropdown({
  value,
  onChange,
}: {
  value: SortOption;
  onChange: (v: SortOption) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = SORT_OPTIONS.find((o) => o.value === value)!;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="flex items-center gap-1.5 text-[11px] tracking-[0.1em] uppercase text-[#111] border border-[#E8E4DE] px-3.5 py-2 hover:border-[#111] transition-colors"
      >
        {current.label}
        <ChevronDown
          size={12}
          className={`transition-transform duration-150 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-[#E8E4DE] shadow-md z-20">
          {SORT_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => { onChange(opt.value); setOpen(false); }}
              className={`block w-full text-left px-4 py-2.5 text-[11px] tracking-[0.08em] transition-colors ${
                opt.value === value
                  ? "text-[#111] font-semibold bg-[#FAFAF8]"
                  : "text-[#6B6B6B] hover:text-[#111] hover:bg-[#FAFAF8]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── ProductBrowser ─────────────────────────────────────────────
export default function ProductBrowser({ category = "all", maxVisible }: Props) {
  const [filters, setFilters]       = useState<FilterState>(DEFAULT_FILTERS);
  const [sort, setSort]             = useState<SortOption>("featured");
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [expanded, setExpanded]     = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);

  // Base set filtered by route category
  const base = PRODUCTS.filter((p) => {
    if (category === "men")   return p.gender === "Men"   || p.gender === "Unisex";
    if (category === "women") return p.gender === "Women" || p.gender === "Unisex";
    return true;
  });

  const results      = filterAndSort(base, filters, sort);
  const activeCount  = countActiveFilters(filters);
  const chips        = buildChips(filters, setFilters);

  const resetFilters = useCallback(() => setFilters(DEFAULT_FILTERS), []);

  // maxVisible slicing
  const trimmed    = maxVisible && !expanded ? results.slice(0, maxVisible) : results;
  const hasMore    = maxVisible !== undefined && results.length > maxVisible;

  // Lock body scroll when sheet is open
  useEffect(() => {
    document.body.style.overflow = sheetOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [sheetOpen]);

  return (
    <div className="w-full">
      {/* ── Toolbar ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 mb-4">
        {/* Results count */}
        <p className="text-[11px] tracking-[0.12em] uppercase text-[#6B6B6B]">
          {results.length} {results.length === 1 ? "result" : "results"}
        </p>

        <div className="flex items-center gap-2.5">
          {/* Mobile filter button */}
          <button
            onClick={() => setSheetOpen(true)}
            className="lg:hidden flex items-center gap-2 text-[11px] tracking-[0.1em] uppercase text-[#111] border border-[#E8E4DE] px-3.5 py-2 hover:border-[#111] transition-colors"
          >
            <SlidersHorizontal size={13} strokeWidth={2} />
            Filter
            {activeCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-[#C9A86C] text-[#111] text-[9px] flex items-center justify-center font-bold">
                {activeCount}
              </span>
            )}
          </button>

          {/* Sort */}
          <SortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      {/* ── Active filter chips ──────────────────────────────── */}
      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-5">
          {chips.map((chip) => (
            <span
              key={chip.label}
              className="flex items-center gap-1.5 text-[10px] tracking-[0.08em] bg-[#F5F1EB] text-[#111] px-2.5 py-1 border border-[#E8E4DE]"
            >
              {chip.label}
              <button
                onClick={chip.onRemove}
                className="text-[#6B6B6B] hover:text-[#111] transition-colors"
                aria-label={`Remove ${chip.label} filter`}
              >
                <X size={10} strokeWidth={2.5} />
              </button>
            </span>
          ))}
          <button
            onClick={resetFilters}
            className="text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B] hover:text-[#111] transition-colors underline underline-offset-2 px-1"
          >
            Clear all
          </button>
        </div>
      )}

      {/* ── Main layout: sidebar + grid ─────────────────────── */}
      <div className="flex gap-8 items-start">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-56 flex-shrink-0 sticky top-28 bg-white border border-[#E8E4DE] p-5 self-start max-h-[calc(100vh-8rem)] overflow-y-auto">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111]">
              Filters
            </h3>
            {activeCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B] hover:text-[#111] transition-colors"
              >
                Reset
              </button>
            )}
          </div>
          <FilterPanel
            filters={filters}
            onChange={setFilters}
            onReset={resetFilters}
          />
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {results.length === 0 ? (
            <div className="py-20 text-center">
              <p className="text-[#6B6B6B] text-sm mb-4">
                No fragrances match your filters.
              </p>
              <button
                onClick={resetFilters}
                className="text-[11px] tracking-[0.15em] uppercase text-[#111] underline underline-offset-2 hover:opacity-70 transition-opacity"
              >
                Reset filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {trimmed.map((product, i) => (
                  <AnimateIn
                    key={product.id}
                    delay={Math.min(i, 7) * 50}
                    direction="up"
                  >
                    <ProductCard
                      name={product.name}
                      brand={product.brand}
                      price={product.price}
                      rating={product.rating}
                      imageSrc={product.imageSrc}
                      tag={product.tag}
                      notes={product.notes}
                    />
                  </AnimateIn>
                ))}
              </div>

              {/* View More / View Less */}
              {hasMore && (
                <div className="mt-10 flex justify-center">
                  <button
                    onClick={() => setExpanded((p) => !p)}
                    className="group flex items-center gap-3 text-[11px] tracking-[0.2em] uppercase text-[#111] border border-[#111] px-8 py-3.5 hover:bg-[#111] hover:text-white transition-all duration-200"
                  >
                    {expanded ? "Show Less" : `View All ${results.length} Decants`}
                    <span className={`transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}>
                      ↓
                    </span>
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Mobile bottom sheet ──────────────────────────────── */}
      {sheetOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setSheetOpen(false)}
          />

          {/* Sheet */}
          <div
            ref={sheetRef}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white lg:hidden animate-slide-in-bottom max-h-[90svh] flex flex-col"
            style={{ borderTopLeftRadius: "12px", borderTopRightRadius: "12px" }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
              <div className="w-10 h-1 bg-[#E8E4DE] rounded-full" />
            </div>

            {/* Sheet header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-[#E8E4DE] flex-shrink-0">
              <h2 className="text-[11px] tracking-[0.2em] uppercase font-semibold text-[#111]">
                Sort & Filter
                {activeCount > 0 && (
                  <span className="ml-2 w-4 h-4 inline-flex items-center justify-center rounded-full bg-[#C9A86C] text-[#111] text-[9px] font-bold">
                    {activeCount}
                  </span>
                )}
              </h2>
              <button
                onClick={() => setSheetOpen(false)}
                className="p-1 text-[#6B6B6B] hover:text-[#111]"
                aria-label="Close filters"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sort pills */}
            <div className="px-5 pt-4 pb-3 border-b border-[#E8E4DE] flex-shrink-0">
              <p className="text-[10px] tracking-[0.18em] uppercase text-[#6B6B6B] mb-2.5">Sort by</p>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => setSort(opt.value)}
                    className={`text-[11px] tracking-[0.06em] px-3.5 py-2 border transition-colors ${
                      sort === opt.value
                        ? "bg-[#111] text-white border-[#111]"
                        : "bg-white text-[#6B6B6B] border-[#E8E4DE] hover:border-[#111] hover:text-[#111]"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable filter panel */}
            <div className="flex-1 overflow-y-auto px-5 pt-2 pb-24">
              <FilterPanel
                filters={filters}
                onChange={setFilters}
                onReset={resetFilters}
              />
            </div>

            {/* Show results button */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-white border-t border-[#E8E4DE]">
              <button
                onClick={() => setSheetOpen(false)}
                className="w-full bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase py-4 hover:bg-[#333] transition-colors"
              >
                Show {results.length} {results.length === 1 ? "Result" : "Results"}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
