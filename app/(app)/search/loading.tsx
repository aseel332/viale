import { Skeleton, ProductGridSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-20">
      <div className="max-w-screen-xl mx-auto px-5 md:px-10">
        <div className="max-w-xl mx-auto mb-14 space-y-4">
          <Skeleton className="h-2.5 w-16 mx-auto" />
          <Skeleton className="h-14 w-full" />
        </div>
        <ProductGridSkeleton
          count={8}
          className="grid grid-cols-2 md:grid-cols-4 gap-5 md:gap-8"
        />
      </div>
    </div>
  );
}
