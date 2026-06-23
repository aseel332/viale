import { AnimateIn } from "@/components/AnimateIn";
import ProductBrowser from "@/components/shopping/ProductBrowser";
import { getStorefrontProducts } from "@/lib/catalog";

export default async function MenPage() {
  const products = await getStorefrontProducts();

  return (
    <>
      <div className="pt-28 pb-12 md:pb-16 bg-[#FAFAF8] border-b border-[#E8E4DE]">
        <div className="max-w-screen-xl mx-auto px-5 md:px-10">
          <AnimateIn>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-3">For Him</p>
            <h1 className="text-4xl md:text-6xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">
              Men
            </h1>
            <p className="text-[#6B6B6B] text-sm mt-3 max-w-md leading-relaxed">
              Bold, refined, unmistakable. Decants of the world&apos;s finest masculine fragrances.
            </p>
          </AnimateIn>
        </div>
      </div>

      <section className="bg-white py-16 md:py-20">
        <div className="max-w-screen-xl mx-auto px-5 md:px-10">
          <ProductBrowser category="men" products={products} />
        </div>
      </section>
    </>
  );
}
