import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-20">
      <div className="max-w-screen-xl mx-auto px-5 md:px-10">
        <div className="mb-10 space-y-2">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-10 w-64" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex gap-4 border border-[#E8E4DE] bg-white p-4">
                <Skeleton className="w-24 h-28 flex-shrink-0" />
                <div className="flex-1 space-y-2 py-1">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-24 mt-4" />
                </div>
              </div>
            ))}
          </div>

          <div className="border border-[#E8E4DE] bg-white p-6 h-fit space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <div className="h-px bg-[#E8E4DE]" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-12 w-full mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
