import { Skeleton } from "@/components/ui/Skeleton";

// Mirrors ProductDetailClient: breadcrumb → image + buy panel grid.
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="max-w-screen-xl mx-auto px-5 md:px-10 pt-28 pb-4">
        <Skeleton className="h-3 w-48" />
      </div>

      <section className="max-w-screen-xl mx-auto px-5 md:px-10 py-8 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 items-start">
        {/* Image + notes */}
        <div>
          <Skeleton className="aspect-[3/4] w-full rounded-none" />
          <div className="flex flex-wrap gap-2 mt-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20" />
            ))}
          </div>
        </div>

        {/* Buy panel */}
        <div className="flex flex-col gap-6 lg:pt-4">
          <div className="space-y-3">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-11 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-4 w-40" />
          <div className="h-px bg-[#E8E4DE]" />
          <div className="flex gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-7 w-20" />
            ))}
          </div>
          <div className="flex gap-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 flex-1" />
            ))}
          </div>
          <Skeleton className="h-12 w-32" />
          <div className="flex flex-col sm:flex-row gap-3">
            <Skeleton className="h-14 flex-1" />
            <Skeleton className="h-14 flex-1" />
          </div>
        </div>
      </section>
    </div>
  );
}
