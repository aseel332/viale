import Link from "next/link";
import { AnimateIn } from "@/components/AnimateIn";
import { getStorefrontCollections, type StorefrontCollection } from "@/lib/catalog";
import { formatPrice } from "@/lib/product-utils";

export const metadata = { title: "Collections — Viale" };

// ── Themed set cards ──────────────────────────────────────────
function SetCard({
  collection,
  theme,
}: {
  collection: StorefrontCollection;
  theme: "summer" | "winter" | "celebrity";
}) {
  const products = collection.products;

  const t = {
    summer: {
      wrap: "bg-gradient-to-b from-[#FBF0D8] via-[#F0D494] to-[#C89030]",
      label: "text-[#7A5010]", num: "text-[#C09030]/20", div: "bg-[#C09030]/30",
      tile: "bg-[#F5D070]/15", name: "text-[#18100A]", sub: "text-[#6A4810]/65",
      list: "text-[#7A5010]", arrow: "text-[#C09030]", brand: "text-[#9A6820]/60",
      cap: "text-[#8B5A14]", price: "text-[#18100A]",
      btn: "bg-[#111] text-white hover:bg-[#333]",
    },
    winter: {
      wrap: "bg-gradient-to-b from-[#1C2440] via-[#101828] to-[#060A14]",
      label: "text-[#6A9BC0]", num: "text-[#4A7AB5]/20", div: "bg-[#4A7AB5]/20",
      tile: "bg-white/[0.04]", name: "text-white", sub: "text-white/35",
      list: "text-[#8AB8D8]", arrow: "text-[#6A9BC0]", brand: "text-white/20",
      cap: "text-[#6A9BC0]", price: "text-white",
      btn: "border border-white/25 text-white hover:bg-white hover:text-[#111]",
    },
    celebrity: {
      wrap: "bg-gradient-to-b from-[#141414] to-[#050505]",
      label: "text-[#C9A86C]", num: "text-[#C9A86C]/15", div: "bg-[#C9A86C]/20",
      tile: "bg-white/[0.03]", name: "text-white", sub: "text-white/25",
      list: "text-[#C9A86C]/70", arrow: "text-[#C9A86C]", brand: "text-white/20",
      cap: "text-[#C9A86C]", price: "text-white",
      btn: "bg-[#C9A86C] text-[#111] hover:bg-[#E8D5A3] font-medium",
    },
  }[theme];

  const seasonLabel = theme === "celebrity" ? "Celebrity" : theme === "winter" ? "Winter" : "Summer";

  return (
    <div className={`flex-shrink-0 w-[300px] sm:w-[320px] ${t.wrap} overflow-hidden group flex flex-col`}>
      {theme === "celebrity" && (
        <div className="h-[2px] bg-gradient-to-r from-transparent via-[#C9A86C] to-transparent" />
      )}
      {/* Header */}
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <p className={`text-[9px] tracking-[0.28em] uppercase ${t.label}`}>{seasonLabel}</p>
          <p className={`font-[family-name:var(--font-cormorant)] italic text-4xl ${t.num} leading-none select-none`}>
            {collection.number}
          </p>
        </div>
        <div className={`mt-2.5 h-px ${t.div}`} />
      </div>

      {/* 2×2 bottle grid */}
      <div className="grid grid-cols-2 gap-2 px-4 pt-4 pb-2">
        {products.map((item) => (
          <div key={item.id} className={`h-[88px] flex items-center justify-center ${t.tile} overflow-hidden`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
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
        <p className={`font-[family-name:var(--font-cormorant)] italic text-[1.4rem] leading-tight ${t.name}`}>
          {collection.name}
        </p>
        <p className={`text-[11px] italic ${t.sub} mt-1 leading-snug`}>{collection.subtitle}</p>
        <div className={`mt-3 h-px ${t.div}`} />

        <div className="mt-2.5 space-y-1">
          {products.map((item) => (
            <p key={item.id} className={`text-[10px] ${t.list} leading-snug`}>
              <span className={`${t.arrow} mr-1.5`}>↳</span>
              {item.name}
              <span className={`${t.brand} ml-1`}>/ {item.brand}</span>
            </p>
          ))}
        </div>

        <div className="mt-4 pb-5 flex items-center justify-between gap-3 mt-auto">
          <div>
            <p className={`text-[9px] tracking-[0.15em] uppercase ${t.cap}`}>Box of 4</p>
            <p className={`text-lg font-semibold ${t.price} leading-none mt-0.5`}>{formatPrice(collection.bundlePrice)}</p>
          </div>
          <Link
            href={`/collections/${collection.id}`}
            className={`flex-1 text-center text-[10px] tracking-[0.15em] uppercase px-3 py-2.5 transition-colors duration-200 ${t.btn}`}
          >
            Shop This Set
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Section block ─────────────────────────────────────────────
function CategorySection({
  id, theme, eyebrow, title, blurb, bgClass, numColor, num, collections,
}: {
  id: string; theme: "summer" | "winter" | "celebrity";
  eyebrow: string; title: string; blurb: string;
  bgClass: string; numColor: string; num: string;
  collections: StorefrontCollection[];
}) {
  const sets = collections.filter((collection) => collection.category === theme);
  const titleColor = theme === "summer" ? "text-[#111]" : "text-white";
  const blurbColor = theme === "summer" ? "text-[#6B6B6B]" : theme === "winter" ? "text-white/40" : "text-white/35";
  const accent = theme === "winter" ? "bg-[#4A7AB5]" : "bg-[#C9A86C]";
  const eyebrowColor = theme === "winter" ? "text-[#6A9BC0]" : "text-[#C9A86C]";

  return (
    <section id={id} className={`${bgClass} py-16 md:py-24 scroll-mt-20`}>
      <div className="max-w-screen-xl mx-auto">
        <div className="px-5 md:px-10 mb-10 md:mb-14">
          <AnimateIn>
            <div className="flex items-start gap-6 md:gap-10">
              <div className="flex-shrink-0 hidden sm:block select-none" aria-hidden>
                <p className={`font-[family-name:var(--font-cormorant)] italic leading-none text-[6rem] md:text-[8rem] ${numColor}`}>
                  {num}
                </p>
              </div>
              <div className="pt-2">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-5 h-px ${accent}`} />
                  <p className={`text-[9px] tracking-[0.3em] uppercase ${eyebrowColor}`}>{eyebrow} · {sets.length} Sets</p>
                </div>
                <h2 className={`text-3xl md:text-5xl font-[family-name:var(--font-cormorant)] italic ${titleColor} mb-3`}>
                  {title}
                </h2>
                <p className={`text-[13px] ${blurbColor} max-w-sm leading-relaxed`}>{blurb}</p>
              </div>
            </div>
          </AnimateIn>
        </div>
        <div className="flex gap-5 overflow-x-auto scrollbar-none px-5 md:px-10 pb-4">
          {sets.map((c) => (
            <SetCard key={c.id} collection={c} theme={theme} />
          ))}
          <div className="flex-shrink-0 w-px md:w-5" aria-hidden />
        </div>
      </div>
    </section>
  );
}

// ── Page ───────────────────────────────────────────────────────
export default async function CollectionsPage() {
  const collections = await getStorefrontCollections();

  return (
    <>
      <div className="pt-28 pb-14 md:pb-20 bg-[#FAFAF8] border-b border-[#E8E4DE]">
        <div className="max-w-screen-xl mx-auto px-5 md:px-10">
          <AnimateIn>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-3">Curated Sets</p>
            <h1 className="text-4xl md:text-6xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">
              Collections
            </h1>
            <p className="text-[#6B6B6B] text-sm mt-4 max-w-md leading-relaxed">
              Each collection is a hand-curated box of 4 luxury decants — chosen to work beautifully together. One season, one mood, one story.
            </p>
          </AnimateIn>

          <AnimateIn delay={100}>
            <div className="flex flex-wrap gap-x-8 gap-y-3 mt-8">
              {["4 decants per box (5ml each)", "100% authentic, sealed bottles", "Ships in 24 hours"].map((pill) => (
                <p key={pill} className="flex items-center gap-2 text-[11px] text-[#6B6B6B]">
                  <span className="text-[#C9A86C]">✦</span> {pill}
                </p>
              ))}
            </div>
          </AnimateIn>

          <AnimateIn delay={150} className="flex flex-wrap gap-5 mt-8 pt-8 border-t border-[#E8E4DE]">
            {[
              { label: "Summer Vibes",    href: "#summer",    color: "text-[#C9A86C]" },
              { label: "Winter Warmth",   href: "#winter",    color: "text-[#7AAFD4]" },
              { label: "Celebrity Picks", href: "#celebrity", color: "text-[#C9A86C]" },
            ].map((nav) => (
              <a key={nav.href} href={nav.href} className={`text-[11px] tracking-[0.15em] uppercase border-b border-transparent hover:border-current pb-px transition-colors ${nav.color}`}>
                {nav.label}
              </a>
            ))}
          </AnimateIn>
        </div>
      </div>

      <CategorySection
        id="summer" theme="summer" eyebrow="Season Edit" num="01" numColor="text-[#F5D898]"
        title="Summer Vibes" bgClass="bg-[#FFFBF3]"
        blurb="Sun-warmed skin, golden hours, the freedom of open air. Carefully assembled sets for the days that stretch on forever."
        collections={collections}
      />
      <CategorySection
        id="winter" theme="winter" eyebrow="Dark Season Edit" num="02" numColor="text-[#1C2440]"
        title="Winter Warmth" bgClass="bg-[#0B0F1A]"
        blurb="When the air turns cold and the nights grow long, these are the scents that demand attention — rich, layered, unforgettable."
        collections={collections}
      />
      <CategorySection
        id="celebrity" theme="celebrity" eyebrow="Icons Wear These" num="03" numColor="text-[#111111]"
        title="Celebrity Picks" bgClass="bg-[#080808]"
        blurb="The niche and designer fragrances spotted on the world's most recognised names. Wear what the icons wear."
        collections={collections}
      />
    </>
  );
}
