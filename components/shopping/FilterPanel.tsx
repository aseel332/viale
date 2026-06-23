"use client";

import { useState } from "react";
import { ChevronDown, Check } from "lucide-react";
import PriceRangeSlider from "./PriceRangeSlider";
import {
  BRANDS, FAMILIES, GENDERS, SEASONS, FEATURED_NOTES,
  FilterState, MIN_PRICE, MAX_PRICE,
} from "@/lib/product-utils";

interface Props {
  filters:  FilterState;
  onChange: (f: FilterState) => void;
  onReset:  () => void;
  brandOptions?: readonly string[];
  noteOptions?: readonly string[];
  priceBounds?: [number, number];
}

// ── Accordion section ─────────────────────────────────────────
function Section({
  title,
  defaultOpen = false,
  count,
  children,
}: {
  title:        string;
  defaultOpen?: boolean;
  count?:       number;
  children:     React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-[#E8E4DE] last:border-0">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex justify-between items-center py-3.5 text-left"
      >
        <span className="flex items-center gap-2 text-[11px] tracking-[0.15em] uppercase font-semibold text-[#111]">
          {title}
          {count ? (
            <span className="w-4 h-4 rounded-full bg-[#C9A86C] text-[#111] text-[9px] flex items-center justify-center font-bold">
              {count}
            </span>
          ) : null}
        </span>
        <ChevronDown
          size={13}
          strokeWidth={2}
          className={`text-[#6B6B6B] transition-transform duration-200 flex-shrink-0 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="pb-5">{children}</div>}
    </div>
  );
}

// ── Pill toggle group ─────────────────────────────────────────
function PillGroup({
  options,
  selected,
  onToggle,
}: {
  options:  readonly string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => {
        const active = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`text-[10px] tracking-[0.08em] px-3 py-1.5 border transition-colors duration-150 ${
              active
                ? "bg-[#111] text-white border-[#111]"
                : "bg-white text-[#6B6B6B] border-[#E8E4DE] hover:border-[#111] hover:text-[#111]"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

// ── Main FilterPanel ──────────────────────────────────────────
export default function FilterPanel({
  filters,
  onChange,
  onReset,
  brandOptions = BRANDS,
  noteOptions = FEATURED_NOTES,
  priceBounds = [MIN_PRICE, MAX_PRICE],
}: Props) {
  const [showAllNotes, setShowAllNotes] = useState(false);
  const [minPrice, maxPrice] = priceBounds;

  const toggle = (field: keyof FilterState, value: string) => {
    const current = filters[field] as string[];
    onChange({
      ...filters,
      [field]: current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value],
    });
  };

  const hasActive =
    filters.families.length > 0 ||
    filters.notes.length    > 0 ||
    filters.brands.length   > 0 ||
    filters.genders.length  > 0 ||
    filters.seasons.length  > 0 ||
    filters.minRating       > 0 ||
    filters.priceRange[0]   > minPrice ||
    filters.priceRange[1]   < maxPrice;

  const displayedNotes = showAllNotes
    ? noteOptions
    : noteOptions.slice(0, 12);

  return (
    <div className="text-sm">
      {/* Reset link */}
      {hasActive && (
        <div className="mb-3 pb-3 border-b border-[#E8E4DE]">
          <button
            onClick={onReset}
            className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] hover:text-[#111] transition-colors underline underline-offset-2"
          >
            Reset all filters
          </button>
        </div>
      )}

      {/* ── Price Range ─────────────────────── */}
      <Section title="Price Range" defaultOpen>
        <PriceRangeSlider
          min={minPrice}
          max={maxPrice}
          step={50}
          value={filters.priceRange}
          onChange={(priceRange) => onChange({ ...filters, priceRange })}
        />
      </Section>

      {/* ── Fragrance Family ────────────────── */}
      <Section
        title="Fragrance Family"
        defaultOpen
        count={filters.families.length || undefined}
      >
        <PillGroup
          options={FAMILIES}
          selected={filters.families}
          onToggle={(v) => toggle("families", v)}
        />
      </Section>

      {/* ── Scent Notes ─────────────────────── */}
      <Section title="Scent Notes" count={filters.notes.length || undefined}>
        <div className="flex flex-wrap gap-1.5">
          {displayedNotes.map((note) => {
            const active = filters.notes.includes(note);
            return (
              <button
                key={note}
                onClick={() => toggle("notes", note)}
                className={`text-[10px] tracking-[0.08em] px-3 py-1.5 border transition-colors duration-150 ${
                  active
                    ? "bg-[#111] text-white border-[#111]"
                    : "bg-white text-[#6B6B6B] border-[#E8E4DE] hover:border-[#111] hover:text-[#111]"
                }`}
              >
                {note}
              </button>
            );
          })}
        </div>
        {noteOptions.length > 12 && (
          <button
            onClick={() => setShowAllNotes((p) => !p)}
            className="mt-3 text-[10px] tracking-[0.1em] uppercase text-[#6B6B6B] hover:text-[#111] transition-colors"
          >
            {showAllNotes
              ? "Show less"
              : `+ ${noteOptions.length - 12} more notes`}
          </button>
        )}
      </Section>

      {/* ── Brand ───────────────────────────── */}
      <Section title="Brand" count={filters.brands.length || undefined}>
        <div className="space-y-2.5 max-h-52 overflow-y-auto pr-1">
          {brandOptions.map((brand) => {
            const checked = filters.brands.includes(brand);
            return (
              <button
                key={brand}
                onClick={() => toggle("brands", brand)}
                className="flex items-center gap-2.5 w-full text-left group"
              >
                <div
                  className={`w-[15px] h-[15px] flex-shrink-0 border transition-colors flex items-center justify-center ${
                    checked
                      ? "bg-[#111] border-[#111]"
                      : "bg-white border-[#E8E4DE] group-hover:border-[#111]"
                  }`}
                >
                  {checked && (
                    <Check size={9} strokeWidth={3} className="text-white" />
                  )}
                </div>
                <span
                  className={`text-[12px] leading-tight transition-colors ${
                    checked ? "text-[#111]" : "text-[#6B6B6B] group-hover:text-[#111]"
                  }`}
                >
                  {brand}
                </span>
              </button>
            );
          })}
        </div>
      </Section>

      {/* ── Gender ──────────────────────────── */}
      <Section
        title="Gender"
        defaultOpen
        count={filters.genders.length || undefined}
      >
        <PillGroup
          options={GENDERS}
          selected={filters.genders}
          onToggle={(v) => toggle("genders", v)}
        />
      </Section>

      {/* ── Season ──────────────────────────── */}
      <Section title="Season" count={filters.seasons.length || undefined}>
        <PillGroup
          options={SEASONS}
          selected={filters.seasons}
          onToggle={(v) => toggle("seasons", v)}
        />
      </Section>

      {/* ── Rating ──────────────────────────── */}
      <Section
        title="Rating"
        count={filters.minRating > 0 ? 1 : undefined}
      >
        <div className="flex gap-2">
          {[
            { label: "★ 4.5+", val: 4.5 },
            { label: "★ 4.0+", val: 4.0 },
            { label: "Any",    val: 0   },
          ].map((opt) => (
            <button
              key={opt.val}
              onClick={() => onChange({ ...filters, minRating: opt.val })}
              className={`text-[10px] tracking-[0.08em] px-3 py-1.5 border transition-colors ${
                filters.minRating === opt.val
                  ? "bg-[#111] text-white border-[#111]"
                  : "bg-white text-[#6B6B6B] border-[#E8E4DE] hover:border-[#111] hover:text-[#111]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </Section>
    </div>
  );
}
