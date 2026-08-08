import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-muted text-muted-foreground border-transparent",
  under_review: "bg-amber-100 text-amber-800 border-transparent",
  changes_requested: "bg-red-100 text-red-800 border-transparent",
  approved: "bg-emerald-100 text-emerald-800 border-transparent",
  finalized: "bg-blue-100 text-blue-800 border-transparent",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant="secondary" className={cn(STATUS_STYLES[status])}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
