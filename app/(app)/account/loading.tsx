import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8] pt-28 pb-20">
      <div className="max-w-screen-xl mx-auto px-5 md:px-10">
        <div className="mb-10 space-y-2">
          <Skeleton className="h-2.5 w-24" />
          <Skeleton className="h-10 w-64" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
          <div className="lg:col-span-3 border border-[#E8E4DE] bg-white p-6 space-y-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
