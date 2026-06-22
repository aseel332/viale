import { AnimateIn } from "@/components/AnimateIn";
import ProductBrowser from "@/components/shopping/ProductBrowser";

export default function WomenPage() {
  return (
    <>
      <div className="pt-28 pb-12 md:pb-16 bg-[#FAFAF8] border-b border-[#E8E4DE]">
        <div className="max-w-screen-xl mx-auto px-5 md:px-10">
          <AnimateIn>
            <p className="text-[10px] tracking-[0.25em] uppercase text-[#C9A86C] mb-3">For Her</p>
            <h1 className="text-4xl md:text-6xl font-[family-name:var(--font-cormorant)] font-medium italic text-[#111]">
              Women
            </h1>
            <p className="text-[#6B6B6B] text-sm mt-3 max-w-md leading-relaxed">
              Floral, sensual, radiant. The most coveted feminine fragrances — beautifully decanted.
            </p>
          </AnimateIn>
        </div>
      </div>

      <section className="bg-white py-16 md:py-20">
        <div className="max-w-screen-xl mx-auto px-5 md:px-10">
          <ProductBrowser category="women" />
        </div>
      </section>
    </>
  );
}

