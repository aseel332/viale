import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-20">
      <div className="max-w-screen-xl mx-auto px-5 md:px-10">
        <div className="mb-10 space-y-2">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-10 w-56" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="border border-[#E8E4DE] bg-white p-6 space-y-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            </div>
            <div className="border border-[#E8E4DE] bg-white p-6 space-y-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-12 w-full" />
            </div>
          </div>

          <div className="border border-[#E8E4DE] bg-white p-6 h-fit space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-12 w-full mt-2" />
          </div>
        </div>
      </div>
    </div>
  );
}
