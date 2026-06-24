import { notFound } from "next/navigation";
import Link from "next/link";
import { COLLECTIONS } from "@/lib/collections";
import { getStorefrontCollectionById, storefrontCollectionRetailTotal } from "@/lib/catalog";
import ProductCard from "@/components/shopping/ProductCard";
import AddCollectionButton from "@/components/shopping/AddCollectionButton";
import { AnimateIn } from "@/components/AnimateIn";
import { formatPrice } from "@/lib/product-utils";

export function generateStaticParams() {
  return COLLECTIONS.map((c) => ({ id: c.id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const collection = await getStorefrontCollectionById(id);
  return { title: collection ? `${collection.name} — Viale Collections` : "Collection — Viale" };
}

const categoryLabel: Record<string, string> = {
  summer: "Summer Edit",
  winter: "Winter Edit",
  celebrity: "Celebrity Picks",
};

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const collection = await getStorefrontCollectionById(id);
  if (!collection) notFound();

  const products = collection.products;
  const items = collection.displayItems;
  const retail = storefrontCollectionRetailTotal(collection);
  const savings = Math.max(0, retail - collection.bundlePrice);

  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      {/* Breadcrumb */}
      <div className="max-w-screen-xl mx-auto px-5 md:px-10 pt-28 pb-4">
        <nav className="flex items-center gap-2 text-[11px] tracking-[0.1em] uppercase text-[#6B6B6B]">
          <Link href="/" className="hover:text-[#111] transition-colors">Home</Link>
          <span>/</span>
          <Link href="/collections" className="hover:text-[#111] transition-colors">Collections</Link>
          <span>/</span>
          <span className="text-[#111]">{collection.name}</span>
        </nav>
      </div>

      {/* Hero */}
      <section className="max-w-screen-xl mx-auto px-5 md:px-10 py-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        {/* 2×2 preview grid */}
        <div className="grid grid-cols-2 gap-3 bg-white border border-[#E8E4DE] p-3">
          {items.map((item, index) => (
            <div key={`${item.name}-${index}`} className="aspect-[3/4] bg-[#F5F1EB] overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.imageSrc} alt={item.name} className="w-full h-full object-cover" />
            </div>
          ))}
        </div>

        {/* Info */}
        <div className="flex flex-col gap-6 lg:pt-4">
          <div>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-2">
              {categoryLabel[collection.category]} · No. {collection.number}
            </p>
            <h1 className="text-[2.5rem] md:text-[3rem] font-[family-name:var(--font-cormorant)] font-medium italic text-[#111] leading-[1.05] mb-3">
              {collection.name}
            </h1>
            <p className="text-[#6B6B6B] text-[14px] leading-relaxed">{collection.description}</p>
          </div>

          <div className="h-px bg-[#E8E4DE]" />

          {/* What's inside */}
          <div>
            <p className="text-[11px] tracking-[0.2em] uppercase text-[#111] mb-3 font-medium">
              4 Decants · 5ml each
            </p>
            <ul className="space-y-2">
              {items.map((item, index) => (
                <li key={`${item.name}-${index}`} className="flex items-center justify-between text-[13px]">
                  {item.href ? (
                    <Link href={item.href} className="text-[#111] hover:text-[#C9A86C] transition-colors">
                      <span className="text-[#C9A86C] mr-2">↳</span>
                      {item.name}
                      <span className="text-[#6B6B6B] ml-2">/ {item.brand}</span>
                    </Link>
                  ) : (
                    <span className="text-[#111]">
                      <span className="text-[#C9A86C] mr-2">↳</span>
                      {item.name}
                      <span className="text-[#6B6B6B] ml-2">/ {item.brand}</span>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Price */}
          <div className="flex items-end gap-4">
            <div>
              <p className="text-[10px] tracking-[0.15em] uppercase text-[#6B6B6B] mb-0.5">Box of 4</p>
              <p className="text-3xl font-[family-name:var(--font-cormorant)] font-medium text-[#111]">
                {formatPrice(collection.bundlePrice)}
              </p>
            </div>
            {savings > 0 && (
              <div className="pb-1">
                <span className="text-[12px] text-[#6B6B6B] line-through mr-2">{formatPrice(retail)}</span>
                <span className="text-[11px] tracking-[0.1em] uppercase text-[#3A7A3A] bg-[#EAF4EA] px-2 py-0.5">
                  Save {formatPrice(savings)}
                </span>
              </div>
            )}
          </div>

          <AddCollectionButton collectionId={collection.id} price={collection.bundlePrice} />

          <p className="text-[11px] text-[#6B6B6B] leading-relaxed border-l-2 border-[#C9A86C] pl-3">
            Delivery in 4–10 days · Secure, discreet packaging · 100% authentic
          </p>
        </div>
      </section>

      {/* Explore the scents — only for product-backed collections */}
      {products.length > 0 && (
        <section className="max-w-screen-xl mx-auto px-5 md:px-10 py-16 border-t border-[#E8E4DE]">
          <AnimateIn className="mb-8">
            <h2 className="text-2xl md:text-3xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">
              Explore the scents
            </h2>
          </AnimateIn>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {products.map((p, i) => (
              <AnimateIn key={p.id} delay={i * 60} direction="up">
                <ProductCard product={p} />
              </AnimateIn>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
