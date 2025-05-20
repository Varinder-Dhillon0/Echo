import { Skeleton } from "@/components/ui/skeleton";

export function CommentSkeleton() {
  return (
    <div className="flex items-start space-x-3 p-4 border-b border-gray-100">
      <Skeleton className="h-8 w-8 rounded-full" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center space-x-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}

export function CommentListSkeleton() {
  return (
    <div className="space-y-1">
      {[1, 2, 3].map((i) => (
        <CommentSkeleton key={i} />
      ))}
    </div>
  );
} 