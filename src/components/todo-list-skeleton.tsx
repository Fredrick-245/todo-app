import { Skeleton } from "@/components/ui/skeleton";

export function TodoListSkeleton() {
  return (
    <div className="flex flex-col gap-3" aria-busy="true" aria-label="Loading todos">
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/[0.03]"
        >
          <div className="flex items-start gap-3">
            <Skeleton className="mt-0.5 h-5 w-5 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-3 w-1/4" />
              <Skeleton className="h-5 w-14 rounded-md" />
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-[6px]" />
              <Skeleton className="h-6 w-6 rounded-[6px]" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
