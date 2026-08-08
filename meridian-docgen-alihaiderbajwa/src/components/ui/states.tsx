import type { LucideIcon } from "lucide-react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("animate-pulse rounded-lg bg-muted", className)}
    />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading records" className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex h-11 items-center gap-6 border-b bg-muted/30 px-4">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="hidden h-3 w-36 sm:block" />
        <Skeleton className="ml-auto h-3 w-20" />
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex h-14 items-center gap-6 px-4">
            <Skeleton className="h-3.5 w-32" />
            <Skeleton className="hidden h-3 w-40 sm:block" />
            <Skeleton className="ml-auto h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-2xl border border-dashed bg-card/70 px-6 py-10 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary ring-1 ring-primary/10">
        <Icon className="size-5" aria-hidden="true" />
      </div>
      <h2 className="mt-4 font-heading text-base font-semibold">{title}</h2>
      <p className="mt-1.5 max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function InlineError({ message }: { message: string }) {
  return (
    <div role="alert" className="flex items-start gap-2.5 rounded-xl border border-destructive/15 bg-destructive/[0.06] px-3.5 py-3 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <p>{message}</p>
    </div>
  );
}
