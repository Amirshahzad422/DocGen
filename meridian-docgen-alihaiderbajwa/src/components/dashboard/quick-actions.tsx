import Link from "next/link";
import { ArrowUpRight, FilePlus2, Inbox, UserPlus, WandSparkles } from "lucide-react";

const actions = [
  { href: "/wizard", label: "Generate document", detail: "Start a guided workflow", icon: WandSparkles },
  { href: "/clients/new", label: "Add client", detail: "Create a client record", icon: UserPlus },
  { href: "/templates/new", label: "Build template", detail: "Create a reusable document", icon: FilePlus2 },
  { href: "/review", label: "Open review queue", detail: "Continue pending work", icon: Inbox },
];

export function QuickActions() {
  return (
    <section className="mt-3" aria-labelledby="quick-actions-heading">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="quick-actions-heading" className="font-heading text-sm font-semibold">Quick actions</h2>
        <span className="text-xs text-muted-foreground">Common workflows</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {actions.map(({ href, label, detail, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex items-center gap-3 rounded-2xl border bg-card/80 p-3.5 shadow-[0_12px_35px_-28px_color-mix(in_oklch,var(--foreground)_40%,transparent)] transition-all hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-md focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
              <Icon className="size-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{label}</p>
              <p className="truncate text-xs text-muted-foreground">{detail}</p>
            </div>
            <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
