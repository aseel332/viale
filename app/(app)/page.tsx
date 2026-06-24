import Link from "next/link";
import ProductCard from "@/components/shopping/ProductCard";
import CollectionCard from "@/components/shopping/CollectionCard";
import { AnimateIn } from "@/components/AnimateIn";
import ProductBrowser from "@/components/shopping/ProductBrowser";
import { effectiveBasePrice, formatPrice } from "@/lib/product-utils";
import { getStorefrontProducts } from "@/lib/catalog";

// ── Seed data ────────────────────────────────────────────────
const topPickIds = ["sauvage-dior", "tobacco-vanille-tf", "aventus-creed"];

const collections = [
  {
    title:       "Summer Vibes",
    subtitle:    "The Season Edit",
    description: "Sun-kissed citrus, airy florals and sparkling aquatics for warm days.",
    href:        "/collections#summer",
    theme:       "summer" as const,
  },
  {
    title:       "Winter Warmth",
    subtitle:    "Dark Season Edit",
    description: "Deep ouds, rich vanillas and smoky woods that linger all evening.",
    href:        "/collections#winter",
    theme:       "winter" as const,
  },
  {
    title:       "Celebrity Picks",
    subtitle:    "Icons Wear These",
    description: "The same niche and designer scents worn by the world's biggest names.",
    href:        "/collections#celebrity",
    theme:       "celebrity" as const,
  },
];

function buildWhyItems(fromPrice: string) {
  return [
  { icon: "✦", title: "100% Authentic",           body: "Every decant is sourced directly from sealed full-size bottles. Never a fake."              },
  { icon: "◈", title: "Try Before You Commit",     body: `Sample any luxury scent from ${fromPrice}. No blind-buying, no regret.`                  },
  { icon: "◉", title: "200+ Luxury Brands",        body: "Dior, Creed, Tom Ford, MFK and hundreds more — all in one place."                         },
  { icon: "◇", title: "Delivery in 4–10 Days",     body: "Discreet, secure packaging shipped with India's most reliable couriers."                  },
  ];
}

// ── Page ─────────────────────────────────────────────────────
export default async function Home() {
  const products = await getStorefrontProducts();
  const lowestBasePrice = products.length > 0 ? Math.min(...products.map(effectiveBasePrice)) : 0;
  const fromPrice = formatPrice(lowestBasePrice);
  const whyItems = buildWhyItems(fromPrice);
  const topPicks = topPickIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is (typeof products)[number] => Boolean(p));

  return (
    <>
      {/* HERO */}
      <section className="min-h-[100svh] bg-gradient-to-br from-[#FAFAF8] to-[#F0EDE8] flex flex-col justify-center relative overflow-hidden">
        {/* Decorative rings — desktop only */}
        <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-[#E8E4DE]/60 translate-x-1/3 pointer-events-none" />
        <div className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-[750px] h-[750px] rounded-full border border-[#E8E4DE]/30 translate-x-1/3 pointer-events-none" />

        {/* ── MOBILE layout (hidden on lg+) ────────────────── */}
        <div className="lg:hidden flex flex-col items-center text-center px-5 pt-24 pb-14">
          <p
            className="text-[10px] tracking-[0.3em] uppercase text-[#C9A86C] mb-5 animate-fade-in"
            style={{ animationDelay: "0.05s" }}
          >
            Premium Decant House
          </p>

          <h1
            className="text-[clamp(2.6rem,12vw,3.8rem)] font-[family-name:var(--font-cormorant)] font-medium italic text-[#111] leading-[1.08] mb-10 animate-slide-up"
            style={{ animationDelay: "0.1s" }}
          >
            Luxury Scents,<br />
            One Drop<br />
            at a Time.
          </h1>

          {/* Product image — anchored, full-width, no float */}
          <div
            className="w-full flex justify-center mb-10 animate-fade-in"
            style={{ animationDelay: "0.25s" }}
          >
            <div className="relative w-[55vw] max-w-[200px]">
              {/* Subtle halo behind bottle for depth */}
              <div className="absolute inset-0 -m-6 rounded-full bg-[#E8D5A3]/20 blur-2xl" />
              <img
                src="/viale_decant.png"
                alt="Viale Luxury Decant"
                className="relative w-full object-contain drop-shadow-xl"
              />
            </div>
          </div>

          <p
            className="text-[#6B6B6B] text-sm leading-relaxed max-w-[280px] mb-8 animate-fade-in"
            style={{ animationDelay: "0.4s" }}
          >
            Try 200+ niche and designer fragrances without the full-bottle commitment.{" "}
            Starting from <span className="text-[#111] font-medium">{fromPrice}</span>.
          </p>

          <div
            className="flex gap-3 w-full max-w-xs animate-fade-in"
            style={{ animationDelay: "0.5s" }}
          >
            <Link
              href="/#all-decants"
              className="flex-1 bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase py-4 text-center hover:bg-[#333] transition-colors duration-200"
            >
              Shop Now
            </Link>
            <Link
              href="/collections"
              className="flex-1 border border-[#111] text-[#111] text-[11px] tracking-[0.2em] uppercase py-4 text-center hover:bg-[#111] hover:text-white transition-colors duration-200"
            >
              Collections
            </Link>
          </div>

          {/* Stats */}
          <div
            className="flex items-center gap-6 mt-10 animate-fade-in"
            style={{ animationDelay: "0.65s" }}
          >
            <div className="text-center">
              <p className="text-xl font-[family-name:var(--font-cormorant)] font-medium text-[#111]">200+</p>
              <p className="text-[9px] tracking-[0.2em] uppercase text-[#6B6B6B]">Brands</p>
            </div>
            <div className="w-px h-8 bg-[#E8E4DE]" />
            <div className="text-center">
              <p className="text-xl font-[family-name:var(--font-cormorant)] font-medium text-[#111]">{fromPrice}</p>
              <p className="text-[9px] tracking-[0.2em] uppercase text-[#6B6B6B]">From</p>
            </div>
            <div className="w-px h-8 bg-[#E8E4DE]" />
            <div className="text-center">
              <p className="text-xl font-[family-name:var(--font-cormorant)] font-medium text-[#111]">4–10d</p>
              <p className="text-[9px] tracking-[0.2em] uppercase text-[#6B6B6B]">Delivery</p>
            </div>
          </div>
        </div>

        {/* ── DESKTOP layout (hidden below lg) ─────────────── */}
        <div className="hidden lg:grid lg:grid-cols-2 lg:gap-0 lg:items-center max-w-screen-xl mx-auto w-full px-10 pt-28 pb-20">
          {/* Text */}
          <div>
            <p
              className="text-[10px] tracking-[0.3em] uppercase text-[#C9A86C] mb-6 animate-fade-in"
              style={{ animationDelay: "0.05s" }}
            >
              Premium Decant House
            </p>
            <h1
              className="text-[clamp(2.8rem,5vw,5.5rem)] font-[family-name:var(--font-cormorant)] font-medium italic text-[#111] leading-[1.05] mb-6 animate-slide-up"
              style={{ animationDelay: "0.1s" }}
            >
              Luxury Scents,<br />
              One Drop<br />
              at a Time.
            </h1>
            <p
              className="text-[#6B6B6B] text-base leading-relaxed max-w-sm mb-10 animate-fade-in"
              style={{ animationDelay: "0.3s" }}
            >
              Try 200+ niche and designer fragrances without the full-bottle commitment.
              Starting from <span className="text-[#111] font-medium">{fromPrice}</span>.
            </p>
            <div className="flex gap-3 animate-fade-in" style={{ animationDelay: "0.45s" }}>
              <Link
                href="/#all-decants"
                className="bg-[#111] text-white text-[11px] tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#333] transition-colors duration-200"
              >
                Shop Now
              </Link>
              <Link
                href="/collections"
                className="border border-[#111] text-[#111] text-[11px] tracking-[0.2em] uppercase px-8 py-4 hover:bg-[#111] hover:text-white transition-colors duration-200"
              >
                Collections
              </Link>
            </div>
            <div className="flex items-center gap-6 mt-12 animate-fade-in" style={{ animationDelay: "0.6s" }}>
              <div className="text-center">
                <p className="text-xl font-[family-name:var(--font-cormorant)] font-medium text-[#111]">200+</p>
                <p className="text-[9px] tracking-[0.2em] uppercase text-[#6B6B6B]">Brands</p>
              </div>
              <div className="w-px h-8 bg-[#E8E4DE]" />
              <div className="text-center">
                <p className="text-xl font-[family-name:var(--font-cormorant)] font-medium text-[#111]">{fromPrice}</p>
                <p className="text-[9px] tracking-[0.2em] uppercase text-[#6B6B6B]">From</p>
              </div>
              <div className="w-px h-8 bg-[#E8E4DE]" />
              <div className="text-center">
                <p className="text-xl font-[family-name:var(--font-cormorant)] font-medium text-[#111]">4–10d</p>
                <p className="text-[9px] tracking-[0.2em] uppercase text-[#6B6B6B]">Delivery</p>
              </div>
            </div>
          </div>

          {/* Decant — float only on desktop */}
          <div className="flex justify-end">
            <img
              src="/viale_decant.png"
              alt="Viale Luxury Decant"
              className="max-h-[480px] object-contain animate-float animate-fade-in"
              style={{ animationDelay: "0.2s" }}
            />
          </div>
        </div>
      </section>

      {/* TOP PICKS */}
      <section className="max-w-screen-xl mx-auto px-5 md:px-10 py-20 md:py-28">
        <AnimateIn className="flex justify-between items-end mb-10">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-2">Curated For You</p>
            <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">Most Loved</h2>
          </div>
          <Link href="/#all-decants" className="text-[10px] tracking-[0.2em] uppercase text-[#6B6B6B] hover:text-[#111] transition-colors hidden sm:block">
            View All →
          </Link>
        </AnimateIn>
        <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 md:grid md:grid-cols-3 md:gap-8 md:overflow-visible md:pb-0">
          {topPicks.map((p, i) => (
            <AnimateIn key={p.id} delay={i * 80} className="min-w-[62vw] sm:min-w-[45vw] md:min-w-0">
              <ProductCard product={p} />
            </AnimateIn>
          ))}
        </div>
      </section>

      {/* COLLECTIONS SPOTLIGHT */}
      <section className="bg-white py-20 md:py-28">
        <div className="max-w-screen-xl mx-auto px-5 md:px-10">
          <AnimateIn className="mb-12">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-2">Shop By Mood</p>
            <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">Collections</h2>
          </AnimateIn>
          <div className="flex gap-4 overflow-x-auto scrollbar-none pb-2 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:pb-0">
            {collections.map((col, i) => (
              <AnimateIn key={col.title} delay={i * 100} className="min-w-[75vw] sm:min-w-[55vw] md:min-w-0">
                <CollectionCard {...col} />
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* WHY VIALE */}
      <section className="bg-[#FAFAF8] py-20 md:py-28 border-t border-[#E8E4DE]">
        <div className="max-w-screen-xl mx-auto px-5 md:px-10">
          <AnimateIn className="text-center mb-14">
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-2">Our Promise</p>
            <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">Why Choose Viale</h2>
          </AnimateIn>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {whyItems.map((item, i) => (
              <AnimateIn key={item.title} delay={i * 80} className="text-center">
                <p className="text-2xl text-[#C9A86C] mb-4">{item.icon}</p>
                <h3 className="text-sm font-semibold text-[#111] mb-2 tracking-wide">{item.title}</h3>
                <p className="text-[13px] text-[#6B6B6B] leading-relaxed">{item.body}</p>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ALL PRODUCTS — ProductBrowser */}
      <section id="all-decants" className="bg-white py-20 md:py-28 scroll-mt-20">
        <div className="max-w-screen-xl mx-auto px-5 md:px-10">
          <AnimateIn className="flex justify-between items-end mb-10">
            <div>
              <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-2">The Full Edit</p>
              <h2 className="text-3xl md:text-4xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">All Decants</h2>
            </div>
          </AnimateIn>
          <ProductBrowser maxVisible={8} products={products} />
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="bg-[#111] py-20 md:py-24">
        <AnimateIn className="max-w-screen-xl mx-auto px-5 md:px-10 text-center">
          <p className="text-[10px] tracking-[0.3em] uppercase text-[#C9A86C] mb-4">Join Thousands of Scent Lovers</p>
          <h2 className="text-3xl md:text-5xl font-[family-name:var(--font-cormorant)] font-medium italic text-white mb-6">
            Your next signature scent<br className="hidden md:block" /> is waiting.
          </h2>
          <p className="text-white/50 text-sm max-w-sm mx-auto mb-10">
            Explore 200+ luxury fragrances. Try them all. Fall in love with one.
          </p>
          <Link href="/#all-decants" className="inline-block bg-[#C9A86C] text-[#111] text-[11px] tracking-[0.2em] uppercase px-10 py-4 hover:bg-[#E8D5A3] transition-colors duration-200 font-medium">
            Start Exploring
          </Link>
        </AnimateIn>
      </section>
    </>
  );
}
