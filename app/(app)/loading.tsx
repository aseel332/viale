import { PageHeaderSkeleton, ProductGridSkeleton } from "@/components/ui/Skeleton";

// Group-level fallback: shown instantly on navigation to any route in the
// (app) group that doesn't define its own loading.tsx (home, men, women,
// collection detail, etc.). Matches the common "header + product grid" shape.
export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-20">
      <div className="max-w-screen-xl mx-auto px-5 md:px-10">
        <PageHeaderSkeleton />
        <div className="mt-12">
          <ProductGridSkeleton count={9} />
        </div>
      </div>
    </div>
  );
}
