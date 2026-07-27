import { Skeleton } from "@/components/ui/skeleton";

export default function StudyDocumentLoading() {
  return (
    <div className="h-screen min-w-0 overflow-hidden bg-canvas">
      <div className="flex h-16 items-center justify-between border-b border-border bg-surface px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32 sm:w-56" />
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)] min-h-0">
        <div className="relative flex-1 bg-surface">
          <div className="absolute inset-0 flex flex-col gap-4 p-5 sm:p-8">
            <Skeleton className="h-8 w-3/5 max-w-xl" />
            <Skeleton className="h-4 w-4/5 max-w-3xl" />
            <Skeleton className="h-4 w-2/3 max-w-2xl" />
            <div className="mt-4 space-y-3">
              {Array.from({ length: 8 }).map((_, index) => (
                <Skeleton
                  key={index}
                  className="h-4"
                  style={{ width: `${88 - (index % 4) * 9}%` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="hidden w-80 shrink-0 border-l border-border bg-canvas p-4 lg:block">
          <Skeleton className="mb-4 h-9 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-2">
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </div>
          <Skeleton className="mt-5 h-28 rounded-xl" />
          <Skeleton className="mt-3 h-28 rounded-xl" />
        </div>
      </div>
    </div>
  );
}
