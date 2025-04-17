import { Skeleton } from "@/components/ui/skeleton"

interface CourtSkeletonProps {
  count?: number
}

export function CourtSkeleton({ count = 4 }: CourtSkeletonProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {Array(count)
        .fill(0)
        .map((_, index) => (
          <div key={index} className="bg-background rounded-lg overflow-hidden shadow border-2 border-white">
            <Skeleton className="w-full h-60" />
            <div className="p-4">
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2 mb-2" />
              <Skeleton className="h-9 w-full mt-4" />
            </div>
          </div>
        ))}
    </div>
  )
}
