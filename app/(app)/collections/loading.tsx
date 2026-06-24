import { Skeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-[#FAFAF8]">
      <div className="pt-28 pb-14 md:pb-20 border-b border-[#E8E4DE]">
        <div className="max-w-screen-xl mx-auto px-5 md:px-10 space-y-4">
          <Skeleton className="h-2.5 w-28" />
          <Skeleton className="h-12 w-72" />
          <Skeleton className="h-3 w-[28rem] max-w-full" />
        </div>
      </div>
      <div className="max-w-screen-xl mx-auto px-5 md:px-10 py-16">
        <div className="flex gap-5 overflow-hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton
              key={i}
              className="flex-shrink-0 w-[300px] sm:w-[320px] h-[420px] rounded-none"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
