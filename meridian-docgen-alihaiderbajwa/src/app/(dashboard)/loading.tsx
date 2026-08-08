import { Skeleton } from "@/components/ui/states";

export default function DashboardLoading() {
  return (
    <div role="status" aria-label="Loading page" className="mx-auto w-full max-w-[100rem]">
      <div className="mb-7 border-b pb-5">
        <Skeleton className="mb-3 h-2.5 w-32" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="mt-3 h-3.5 w-full max-w-md" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-40 rounded-2xl" />
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
        <Skeleton className="h-72 rounded-2xl lg:col-span-3" />
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
