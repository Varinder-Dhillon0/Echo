import { Skeleton } from "@/components/ui/skeleton";

export function ThoughtSkeleton() {
  return (
    <article className="px-4 py-3 border-b border-gray-100 bg-white">
      <div className="flex gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <Skeleton className="w-12 h-12 rounded-full bg-gray-200" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-32 bg-gray-200" /> {/* Username */}
            <Skeleton className="h-4 w-20 bg-gray-200" /> {/* Handle */}
            <Skeleton className="h-4 w-16 bg-gray-200" /> {/* Date */}
          </div>

          {/* Post content */}
          <div className="mt-3 space-y-2">
            <Skeleton className="h-4 w-full bg-gray-200" />
            <Skeleton className="h-4 w-[85%] bg-gray-200" />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between mt-4 px-4">
            <Skeleton className="w-8 h-8 rounded-full bg-gray-200" />
            <Skeleton className="w-8 h-8 rounded-full bg-gray-200" />
            <Skeleton className="w-8 h-8 rounded-full bg-gray-200" />
            <Skeleton className="w-8 h-8 rounded-full bg-gray-200" />
          </div>
        </div>
      </div>
    </article>
  );
}
