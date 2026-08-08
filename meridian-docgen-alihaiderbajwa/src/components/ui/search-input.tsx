import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function SearchInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  return (
    <label className={cn("relative block w-full max-w-sm", className)}>
      <span className="sr-only">{props.placeholder ?? "Search"}</span>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      <Input {...props} type="search" className="h-10 bg-card pl-9 shadow-sm" />
    </label>
  );
}
