"use client";

import { useEffect, useState } from "react";
import { Menu, Scale, X } from "lucide-react";
import Sidebar from "@/components/dashboard/sidebar";
import { PageTransition } from "@/components/motion/page-transition";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";

export function DashboardShell({
  children,
  userName,
  userEmail,
}: {
  children: React.ReactNode;
  userName?: string | null;
  userEmail?: string | null;
}) {
  const [navigationOpen, setNavigationOpen] = useState(false);

  useEffect(() => {
    if (!navigationOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [navigationOpen]);

  return (
    <div className="min-h-screen bg-background lg:flex">
      <a
        href="#main-content"
        className="fixed left-4 top-3 z-[70] -translate-y-20 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-transform focus:translate-y-0"
      >
        Skip to content
      </a>

      <Sidebar
        userName={userName}
        userEmail={userEmail}
        className="hidden lg:flex"
      />

      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/90 px-4 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Scale className="size-4.5" aria-hidden="true" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-tight">Meridian DocGen</p>
            <p className="text-[0.68rem] text-muted-foreground">Legal workspace</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button
          variant="outline"
          size="icon"
          aria-label="Open navigation"
          aria-expanded={navigationOpen}
          aria-controls="mobile-navigation"
          onClick={() => setNavigationOpen(true)}
        >
          <Menu aria-hidden="true" />
        </Button>
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-sm transition-opacity duration-200 lg:hidden ${
          navigationOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-hidden="true"
        onClick={() => setNavigationOpen(false)}
      />
      <div
        id="mobile-navigation"
        role="dialog"
        aria-modal={navigationOpen ? "true" : undefined}
        aria-hidden={!navigationOpen}
        inert={!navigationOpen}
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-50 w-[min(20rem,88vw)] transition-transform duration-300 ease-out lg:hidden ${
          navigationOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Button
          variant="outline"
          size="icon"
          className="absolute right-3 top-3 z-10 bg-card"
          aria-label="Close navigation"
          onClick={() => setNavigationOpen(false)}
        >
          <X aria-hidden="true" />
        </Button>
        <Sidebar
          userName={userName}
          userEmail={userEmail}
          className="w-full"
          onNavigate={() => setNavigationOpen(false)}
        />
      </div>

      <main
        id="main-content"
        className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8 lg:py-8"
      >
        <PageTransition>{children}</PageTransition>
      </main>
    </div>
  );
}
