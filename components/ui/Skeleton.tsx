import { cn } from "@/lib/utils";

/**
 * Shimmering placeholder block. Compose these to build route-level loading
 * skeletons (see the various `loading.tsx` files) so navigation shows instant,
 * structure-matching feedback while the real server content streams in.
 */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton rounded-sm", className)} aria-hidden />;
}

/** Placeholder matching a single ProductCard (3:4 image + meta lines). */
export function ProductCardSkeleton() {
  return (
    <div className="w-full">
      <Skeleton className="aspect-[3/4] w-full rounded-none" />
      <div className="pt-3 space-y-2">
        <Skeleton className="h-2.5 w-1/3" />
        <Skeleton className="h-3.5 w-3/4" />
        <Skeleton className="h-2.5 w-2/3" />
        <div className="flex justify-between pt-1">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-8" />
        </div>
      </div>
    </div>
  );
}

/** A responsive grid of ProductCard placeholders. */
export function ProductGridSkeleton({
  count = 8,
  className = "grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6",
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}

/** Eyebrow + heading band used at the top of most pages. */
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-2.5 w-24" />
      <Skeleton className="h-9 w-56 max-w-[70%]" />
      <Skeleton className="h-3 w-80 max-w-[90%]" />
    </div>
  );
}
