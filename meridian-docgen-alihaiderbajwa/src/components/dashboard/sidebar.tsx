"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  FileText,
  Users,
  Wand2,
  Inbox,
  ShieldCheck,
  BarChart3,
  Settings,
  LogOut,
  Scale,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/templates", label: "Templates", icon: FileText },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/wizard", label: "Wizard", icon: Wand2 },
  { href: "/review", label: "Review Queue", icon: Inbox },
  { href: "/staff", label: "Staff", icon: ShieldCheck },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar({
  userName,
  userEmail,
  className,
  onNavigate,
}: {
  userName?: string | null;
  userEmail?: string | null;
  className?: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <aside className={cn("sticky top-0 flex h-screen w-72 shrink-0 flex-col border-r bg-card/95", className)}>
      <div className="flex h-20 items-center gap-3 border-b px-5">
        <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
          <Scale className="size-5" aria-hidden="true" />
        </div>
        <div>
          <p className="font-heading text-sm font-semibold leading-tight">Meridian DocGen</p>
          <p className="mt-0.5 text-[0.68rem] uppercase tracking-[0.13em] text-muted-foreground">Legal workspace</p>
        </div>
      </div>

      <div className="px-5 pb-2 pt-5 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        Workspace
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-3" aria-label="Primary navigation">
        {nav.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-muted-foreground transition-all hover:bg-muted hover:text-foreground",
                active && "bg-primary/[0.08] text-primary shadow-[inset_0_0_0_1px_color-mix(in_oklch,var(--primary)_10%,transparent)] hover:bg-primary/[0.1] hover:text-primary",
              )}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
            >
              {active && <span className="absolute inset-y-2 left-0 w-0.5 rounded-full bg-primary" />}
              <Icon className="size-4 transition-transform group-hover:scale-105" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t bg-muted/25 p-3">
        <div className="mb-2 flex items-center gap-2.5 rounded-xl px-2 py-1.5">
          <div className="relative flex size-9 items-center justify-center rounded-xl bg-primary/10 text-sm font-semibold text-primary ring-1 ring-primary/10">
            {(userName ?? "?")[0]}
            <Sparkles className="absolute -right-1 -top-1 size-3 rounded-full bg-card p-0.5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{userName ?? "User"}</p>
            <p className="truncate text-xs text-muted-foreground">{userEmail ?? ""}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" className="flex-1 justify-start text-muted-foreground" onClick={signOut}>
            <LogOut className="mr-2 h-4 w-4" /> Sign out
          </Button>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
