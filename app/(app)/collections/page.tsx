import Link from "next/link";
import { AnimateIn } from "@/components/AnimateIn";

// ── Types ──────────────────────────────────────────────────────
// Each CollectionSet is a curated box of exactly 4 decants.
// To add a new collection: append a new object to the relevant *Sets array.
interface SetItem {
  name:     string;
  brand:    string;
  imageSrc: string;
}

interface CollectionSet {
  id:          string;
  number:      string;       // "01", "02", …
  name:        string;       // "The Fresh Escape"
  subtitle:    string;       // one-line editorial copy
  items:       SetItem[];    // always 4
  bundlePrice: number;       // total box price (USD)
}

// ── Summer sets ───────────────────────────────────────────────
// Add new summer collections here ↓
const summerSets: CollectionSet[] = [
  {
    id: "summer-01", number: "01",
    name: "The Fresh Escape",
    subtitle: "Crisp, solar and unmistakably summer",
    items: [
      { name: "Sauvage",        brand: "Dior",    imageSrc: "/top_1.png"          },
      { name: "Bleu de Chanel", brand: "Chanel",  imageSrc: "/collection_img.png" },
      { name: "Hacivat",        brand: "Nishane", imageSrc: "/top_3.png"          },
      { name: "Libre",          brand: "YSL",     imageSrc: "/top_2.png"          },
    ],
    bundlePrice: 74,
  },
  {
    id: "summer-02", number: "02",
    name: "Garden in Bloom",
    subtitle: "Floral and feminine, made for golden hours",
    items: [
      { name: "Flowerbomb",         brand: "Viktor & Rolf",          imageSrc: "/collection_img.png" },
      { name: "Miss Dior",          brand: "Dior",                   imageSrc: "/collection_img.png" },
      { name: "Baccarat Rouge 540", brand: "Maison Francis Kurkdjian", imageSrc: "/collection_img.png" },
      { name: "Flowerbomb",         brand: "Viktor & Rolf",          imageSrc: "/top_2.png"          },
    ],
    bundlePrice: 82,
  },
];

// ── Winter sets ───────────────────────────────────────────────
const winterSets: CollectionSet[] = [
  {
    id: "winter-01", number: "01",
    name: "The Dark Luxe",
    subtitle: "Rich, smoky and built for cold nights",
    items: [
      { name: "Tobacco Vanille",   brand: "Tom Ford",      imageSrc: "/top_2.png"          },
      { name: "Oud Wood",          brand: "Tom Ford",      imageSrc: "/collection_img.png" },
      { name: "Black Orchid",      brand: "Tom Ford",      imageSrc: "/top_3.png"          },
      { name: "Spicebomb Extreme", brand: "Viktor & Rolf", imageSrc: "/top_1.png"          },
    ],
    bundlePrice: 88,
  },
  {
    id: "winter-02", number: "02",
    name: "Sweet Noir",
    subtitle: "Warm, indulgent and dangerously addictive",
    items: [
      { name: "Lost Cherry",       brand: "Tom Ford",         imageSrc: "/collection_img.png" },
      { name: "Black Opium",       brand: "YSL",              imageSrc: "/collection_img.png" },
      { name: "Good Girl",         brand: "Carolina Herrera", imageSrc: "/collection_img.png" },
      { name: "Coco Mademoiselle", brand: "Chanel",           imageSrc: "/top_2.png"          },
    ],
    bundlePrice: 76,
  },
];

// ── Celebrity sets ────────────────────────────────────────────
const celebritySets: CollectionSet[] = [
  {
    id: "celeb-01", number: "01",
    name: "Red Carpet Ready",
    subtitle: "The most coveted names in luxury fragrance",
    items: [
      { name: "Baccarat Rouge 540", brand: "MFK",      imageSrc: "/collection_img.png" },
      { name: "Aventus",            brand: "Creed",    imageSrc: "/top_3.png"          },
      { name: "Coco Mademoiselle",  brand: "Chanel",   imageSrc: "/top_2.png"          },
      { name: "Lost Cherry",        brand: "Tom Ford", imageSrc: "/collection_img.png" },
    ],
    bundlePrice: 104,
  },
  {
    id: "celeb-02", number: "02",
    name: "Power Signatures",
    subtitle: "Bold, commanding and impossible to ignore",
    items: [
      { name: "Tobacco Vanille", brand: "Tom Ford", imageSrc: "/top_2.png"          },
      { name: "Oud Wood",        brand: "Tom Ford", imageSrc: "/collection_img.png" },
      { name: "Sauvage",         brand: "Dior",     imageSrc: "/top_1.png"          },
      { name: "Aventus",         brand: "Creed",    imageSrc: "/top_3.png"          },
    ],
    bundlePrice: 96,
  },
];

// ── Collection set card components ────────────────────────────

function SummerSetCard({ set }: { set: CollectionSet }) {
  return (
    <div className="flex-shrink-0 w-[300px] sm:w-[320px] bg-gradient-to-b from-[#FBF0D8] via-[#F0D494] to-[#C89030] overflow-hidden group flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <p className="text-[9px] tracking-[0.28em] uppercase text-[#7A5010]">Summer</p>
          <p className="font-[family-name:var(--font-cormorant)] italic text-4xl text-[#C09030]/20 leading-none select-none">
            {set.number}
          </p>
        </div>
        <div className="mt-2.5 h-px bg-[#C09030]/30" />
      </div>

      {/* 2×2 bottle grid */}
      <div className="grid grid-cols-2 gap-2 px-4 pt-4 pb-2">
        {set.items.map((item) => (
          <div
            key={item.name + item.brand}
            className="h-[88px] flex items-center justify-center bg-[#F5D070]/15 overflow-hidden"
          >
            <img
              src={item.imageSrc}
              alt={item.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 pt-3 flex-1 flex flex-col">
        <p className="font-[family-name:var(--font-cormorant)] italic text-[1.4rem] leading-tight text-[#18100A]">
          {set.name}
        </p>
        <p className="text-[11px] italic text-[#6A4810]/65 mt-1 leading-snug">{set.subtitle}</p>
        <div className="mt-3 h-px bg-[#C09030]/25" />

        {/* Items list */}
        <div className="mt-2.5 space-y-1">
          {set.items.map((item, i) => (
            <p key={i} className="text-[10px] text-[#7A5010] leading-snug">
              <span className="text-[#C09030] mr-1.5">↳</span>
              {item.name}
              <span className="text-[#9A6820]/60 ml-1">/ {item.brand}</span>
            </p>
          ))}
        </div>

        {/* Price + CTA */}
        <div className="mt-4 pb-5 flex items-center justify-between gap-3 mt-auto">
          <div>
            <p className="text-[9px] tracking-[0.15em] uppercase text-[#8B5A14]">Box of 4</p>
            <p className="text-lg font-semibold text-[#18100A] leading-none mt-0.5">${set.bundlePrice}</p>
          </div>
          <Link
            href="/search"
            className="flex-1 text-center text-[10px] tracking-[0.15em] uppercase bg-[#111] text-white px-3 py-2.5 hover:bg-[#333] transition-colors duration-200"
          >
            Shop This Set
          </Link>
        </div>
      </div>
    </div>
  );
}

function WinterSetCard({ set }: { set: CollectionSet }) {
  return (
    <div className="flex-shrink-0 w-[300px] sm:w-[320px] bg-gradient-to-b from-[#1C2440] via-[#101828] to-[#060A14] overflow-hidden group flex flex-col">
      {/* Header */}
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <p className="text-[9px] tracking-[0.28em] uppercase text-[#6A9BC0]">Winter</p>
          <p className="font-[family-name:var(--font-cormorant)] italic text-4xl text-[#4A7AB5]/20 leading-none select-none">
            {set.number}
          </p>
        </div>
        <div className="mt-2.5 h-px bg-[#4A7AB5]/20" />
      </div>

      {/* 2×2 bottle grid */}
      <div className="grid grid-cols-2 gap-2 px-4 pt-4 pb-2">
        {set.items.map((item) => (
          <div
            key={item.name + item.brand}
            className="h-[88px] flex items-center justify-center bg-[#FFFFFF]/4 overflow-hidden"
          >
            <img
              src={item.imageSrc}
              alt={item.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              style={{ filter: "drop-shadow(0 4px 12px rgba(74,122,181,0.25))" }}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 pt-3 flex-1 flex flex-col">
        <p className="font-[family-name:var(--font-cormorant)] italic text-[1.4rem] leading-tight text-white">
          {set.name}
        </p>
        <p className="text-[11px] italic text-white/35 mt-1 leading-snug">{set.subtitle}</p>
        <div className="mt-3 h-px bg-[#4A7AB5]/20" />

        <div className="mt-2.5 space-y-1">
          {set.items.map((item, i) => (
            <p key={i} className="text-[10px] text-[#8AB8D8] leading-snug">
              <span className="text-[#6A9BC0] mr-1.5">↳</span>
              {item.name}
              <span className="text-white/20 ml-1">/ {item.brand}</span>
            </p>
          ))}
        </div>

        <div className="mt-4 pb-5 flex items-center justify-between gap-3 mt-auto">
          <div>
            <p className="text-[9px] tracking-[0.15em] uppercase text-[#6A9BC0]">Box of 4</p>
            <p className="text-lg font-semibold text-white leading-none mt-0.5">${set.bundlePrice}</p>
          </div>
          <Link
            href="/search"
            className="flex-1 text-center text-[10px] tracking-[0.15em] uppercase border border-white/25 text-white px-3 py-2.5 hover:bg-white hover:text-[#111] transition-colors duration-200"
          >
            Shop This Set
          </Link>
        </div>
      </div>
    </div>
  );
}

function CelebSetCard({ set }: { set: CollectionSet }) {
  return (
    <div className="flex-shrink-0 w-[300px] sm:w-[320px] bg-gradient-to-b from-[#141414] to-[#050505] overflow-hidden group flex flex-col">
      {/* Gold hairline */}
      <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A86C] to-transparent" />

      {/* Header */}
      <div className="px-5 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-[9px] tracking-[0.28em] uppercase text-[#C9A86C]">Celebrity</p>
          <p className="font-[family-name:var(--font-cormorant)] italic text-4xl text-[#C9A86C]/15 leading-none select-none">
            {set.number}
          </p>
        </div>
        <div className="mt-2.5 h-px bg-[#C9A86C]/20" />
      </div>

      {/* 2×2 bottle grid */}
      <div className="grid grid-cols-2 gap-2 px-4 pt-4 pb-2">
        {set.items.map((item) => (
          <div
            key={item.name + item.brand}
            className="h-[88px] flex items-center justify-center bg-white/3 overflow-hidden"
          >
            <img
              src={item.imageSrc}
              alt={item.name}
              className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
              style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.7)) brightness(1.05)" }}
            />
          </div>
        ))}
      </div>

      {/* Content */}
      <div className="px-5 pt-3 flex-1 flex flex-col">
        <p className="font-[family-name:var(--font-cormorant)] italic text-[1.4rem] leading-tight text-white">
          {set.name}
        </p>
        <p className="text-[11px] italic text-white/25 mt-1 leading-snug">{set.subtitle}</p>
        <div className="mt-3 h-px bg-[#C9A86C]/20" />

        <div className="mt-2.5 space-y-1">
          {set.items.map((item, i) => (
            <p key={i} className="text-[10px] text-[#C9A86C]/70 leading-snug">
              <span className="text-[#C9A86C] mr-1.5">↳</span>
              {item.name}
              <span className="text-white/20 ml-1">/ {item.brand}</span>
            </p>
          ))}
        </div>

        <div className="mt-4 pb-5 flex items-center justify-between gap-3 mt-auto">
          <div>
            <p className="text-[9px] tracking-[0.15em] uppercase text-[#C9A86C]">Box of 4</p>
            <p className="text-lg font-semibold text-white leading-none mt-0.5">${set.bundlePrice}</p>
          </div>
          <Link
            href="/search"
            className="flex-1 text-center text-[10px] tracking-[0.15em] uppercase bg-[#C9A86C] text-[#111] px-3 py-2.5 hover:bg-[#E8D5A3] transition-colors duration-200 font-medium"
          >
            Shop This Set
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default function CollectionsPage() {
  return (
    <>
      {/* ── Page header ─────────────────────────────────────── */}
      <div className="pt-28 pb-14 md:pb-20 bg-[#FAFAF8] border-b border-[#E8E4DE]">
        <div className="max-w-screen-xl mx-auto px-5 md:px-10">
          <AnimateIn>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-3">
              Curated Sets
            </p>
            <h1 className="text-4xl md:text-6xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">
              Collections
            </h1>
            <p className="text-[#6B6B6B] text-sm mt-4 max-w-md leading-relaxed">
              Each collection is a hand-curated box of 4 luxury decants — chosen to work beautifully together. One season, one mood, one story.
            </p>
          </AnimateIn>

          {/* Trust pillars */}
          <AnimateIn delay={100}>
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-8">
              {[
                "4 decants per box (5ml each)",
                "100% authentic, sealed bottles",
                "Ships in 24 hours",
              ].map((pill) => (
                <p key={pill} className="flex items-center gap-2 text-[11px] text-[#6B6B6B]">
                  <span className="text-[#C9A86C]">✦</span> {pill}
                </p>
              ))}
            </div>
          </AnimateIn>

          {/* Quick-nav */}
          <AnimateIn delay={150} className="flex flex-wrap gap-5 mt-8 pt-8 border-t border-[#E8E4DE]">
            {[
              { label: "Summer Vibes",    href: "#summer",    color: "text-[#C9A86C]"  },
              { label: "Winter Warmth",   href: "#winter",    color: "text-[#7AAFD4]"  },
              { label: "Celebrity Picks", href: "#celebrity", color: "text-[#C9A86C]"  },
            ].map((nav) => (
              <a
                key={nav.href}
                href={nav.href}
                className={`text-[11px] tracking-[0.15em] uppercase border-b border-transparent hover:border-current pb-px transition-colors ${nav.color}`}
              >
                {nav.label}
              </a>
            ))}
          </AnimateIn>
        </div>
      </div>

      {/* ── SUMMER ──────────────────────────────────────────── */}
      <section id="summer" className="bg-[#FFFBF3] py-16 md:py-24 scroll-mt-20">
        <div className="max-w-screen-xl mx-auto">
          <div className="px-5 md:px-10 mb-10 md:mb-14">
            <AnimateIn>
              <div className="flex items-start gap-6 md:gap-10">
                <div className="flex-shrink-0 hidden sm:block select-none" aria-hidden>
                  <p className="font-[family-name:var(--font-cormorant)] italic leading-none text-[6rem] md:text-[8rem] text-[#F5D898]">
                    01
                  </p>
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-5 h-px bg-[#C9A86C]" />
                    <p className="text-[9px] tracking-[0.3em] uppercase text-[#C9A86C]">Season Edit · {summerSets.length} Sets</p>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-[family-name:var(--font-cormorant)] italic text-[#111] mb-3">
                    Summer Vibes
                  </h2>
                  <p className="text-[13px] text-[#6B6B6B] max-w-sm leading-relaxed">
                    Sun-warmed skin, golden hours, the freedom of open air. Two carefully assembled sets for the days that stretch on forever.
                  </p>
                </div>
              </div>
            </AnimateIn>
          </div>
          <div className="flex gap-5 overflow-x-auto scrollbar-none px-5 md:px-10 pb-4">
            {summerSets.map((set) => (
              <SummerSetCard key={set.id} set={set} />
            ))}
            <div className="flex-shrink-0 w-px md:w-5" aria-hidden />
          </div>
          <p className="px-5 md:px-10 mt-3 text-[10px] tracking-[0.15em] uppercase text-[#C9A86C]/50 md:hidden">
            Swipe to see all sets →
          </p>
        </div>
      </section>

      {/* ── WINTER ──────────────────────────────────────────── */}
      <section id="winter" className="bg-[#0B0F1A] py-16 md:py-24 scroll-mt-20">
        <div className="max-w-screen-xl mx-auto">
          <div className="px-5 md:px-10 mb-10 md:mb-14">
            <AnimateIn>
              <div className="flex items-start gap-6 md:gap-10">
                <div className="flex-shrink-0 hidden sm:block select-none" aria-hidden>
                  <p className="font-[family-name:var(--font-cormorant)] italic leading-none text-[6rem] md:text-[8rem] text-[#1C2440]">
                    02
                  </p>
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-5 h-px bg-[#4A7AB5]" />
                    <p className="text-[9px] tracking-[0.3em] uppercase text-[#6A9BC0]">Dark Season Edit · {winterSets.length} Sets</p>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-[family-name:var(--font-cormorant)] italic text-white mb-3">
                    Winter Warmth
                  </h2>
                  <p className="text-[13px] text-white/40 max-w-sm leading-relaxed">
                    When the air turns cold and the nights grow long, these are the scents that demand attention — rich, layered, unforgettable.
                  </p>
                </div>
              </div>
            </AnimateIn>
          </div>
          <div className="flex gap-5 overflow-x-auto scrollbar-none px-5 md:px-10 pb-4">
            {winterSets.map((set) => (
              <WinterSetCard key={set.id} set={set} />
            ))}
            <div className="flex-shrink-0 w-px md:w-5" aria-hidden />
          </div>
          <p className="px-5 md:px-10 mt-3 text-[10px] tracking-[0.15em] uppercase text-[#6A9BC0]/40 md:hidden">
            Swipe to see all sets →
          </p>
        </div>
      </section>

      {/* ── CELEBRITY ───────────────────────────────────────── */}
      <section id="celebrity" className="bg-[#080808] py-16 md:py-24 scroll-mt-20">
        <div className="max-w-screen-xl mx-auto">
          <div className="px-5 md:px-10 mb-10 md:mb-14">
            <AnimateIn>
              <div className="flex items-start gap-6 md:gap-10">
                <div className="flex-shrink-0 hidden sm:block select-none" aria-hidden>
                  <p className="font-[family-name:var(--font-cormorant)] italic leading-none text-[6rem] md:text-[8rem] text-[#111111]">
                    03
                  </p>
                </div>
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-5 h-px bg-[#C9A86C]" />
                    <p className="text-[9px] tracking-[0.3em] uppercase text-[#C9A86C]">Icons Wear These · {celebritySets.length} Sets</p>
                  </div>
                  <h2 className="text-3xl md:text-5xl font-[family-name:var(--font-cormorant)] italic text-white mb-3">
                    Celebrity Picks
                  </h2>
                  <p className="text-[13px] text-white/35 max-w-sm leading-relaxed">
                    The niche and designer fragrances spotted on the world's most recognised names. Wear what the icons wear.
                  </p>
                </div>
              </div>
            </AnimateIn>
          </div>
          <div className="flex gap-5 overflow-x-auto scrollbar-none px-5 md:px-10 pb-4">
            {celebritySets.map((set) => (
              <CelebSetCard key={set.id} set={set} />
            ))}
            <div className="flex-shrink-0 w-px md:w-5" aria-hidden />
          </div>
          <p className="px-5 md:px-10 mt-3 text-[10px] tracking-[0.15em] uppercase text-[#C9A86C]/30 md:hidden">
            Swipe to see all sets →
          </p>
        </div>
      </section>
    </>
  );
}

