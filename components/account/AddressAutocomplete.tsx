"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";

export type GeocodeSuggestion = {
  label: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  lat: string | null;
  lon: string | null;
};

interface Props {
  onSelect: (suggestion: GeocodeSuggestion) => void;
}

export default function AddressAutocomplete({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GeocodeSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      abortRef.current?.abort();
      return;
    }

    const timer = window.setTimeout(async () => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setLoading(true);

      try {
        const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { results?: GeocodeSuggestion[] };
        setResults(data.results ?? []);
        setOpen(true);
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setResults([]);
        }
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => window.clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative">
      <label className="block text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-2">
        Find Address
      </label>
      <div className="relative">
        <Search size={15} strokeWidth={1.5} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            const next = e.target.value;
            setQuery(next);
            if (next.trim().length < 3) {
              setResults([]);
              setOpen(false);
            }
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          placeholder="Search Indian addresses, landmarks or PIN codes"
          className="w-full pl-9 pr-10 py-3 bg-white border border-[#E8E4DE] text-sm text-[#111] placeholder:text-[#B0ADA8] focus:outline-none focus:border-[#111] transition-colors"
        />
        {loading && (
          <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-[#6B6B6B]" />
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-[95] mt-1 max-h-64 overflow-y-auto border border-[#E8E4DE] bg-white shadow-lg">
          {results.map((result, index) => (
            <button
              key={`${result.label}-${index}`}
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onSelect(result);
                setQuery(result.label);
                setOpen(false);
              }}
              className="flex w-full gap-3 px-4 py-3 text-left hover:bg-[#FAFAF8] transition-colors border-b border-[#F0EDE8] last:border-0"
            >
              <MapPin size={15} strokeWidth={1.5} className="mt-0.5 flex-shrink-0 text-[#C9A86C]" />
              <span className="text-[12px] leading-relaxed text-[#4A4A4A]">{result.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
