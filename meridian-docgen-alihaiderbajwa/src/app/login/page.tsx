"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { FileCheck2, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { gsap } from "gsap";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SpotlightCard } from "@/components/react-bits/spotlight-card";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const benefits = [
  { icon: FileCheck2, label: "Guided document workflows" },
  { icon: ShieldCheck, label: "Role-aware review controls" },
  { icon: LockKeyhole, label: "Protected client records" },
];

export default function LoginPage() {
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia(pageRef);
    mm.add(
      { reduceMotion: "(prefers-reduced-motion: reduce)" },
      (context) => {
        if (context.conditions?.reduceMotion) return;
        gsap.fromTo(
          "[data-login-reveal]",
          { autoAlpha: 0, y: 18 },
          {
            autoAlpha: 1,
            y: 0,
            duration: 0.65,
            stagger: 0.075,
            ease: "power3.out",
            clearProps: "transform,opacity,visibility",
          },
        );
      },
    );
    return () => mm.revert();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    setLoading(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main
      ref={pageRef}
      className="relative grid min-h-screen overflow-hidden bg-slate-950 lg:grid-cols-[1.08fr_0.92fr]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_12%,rgba(79,111,162,0.32),transparent_30rem),radial-gradient(circle_at_82%_85%,rgba(178,143,67,0.12),transparent_25rem)]" />

      <section className="relative hidden flex-col justify-between border-r border-white/10 p-10 text-white lg:flex xl:p-14">
        <div data-login-reveal className="flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
            <Scale className="size-5 text-amber-300" aria-hidden="true" />
          </div>
          <div>
            <p className="font-heading text-sm font-semibold">Meridian Legal Group</p>
            <p className="text-xs text-slate-400">Document intelligence workspace</p>
          </div>
        </div>

        <div className="max-w-xl">
          <p data-login-reveal className="mb-5 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300/85">
            Draft with confidence
          </p>
          <h1 data-login-reveal className="font-heading text-5xl font-semibold leading-[1.08] tracking-[-0.035em] xl:text-6xl">
            Legal documents,
            <span className="block text-slate-400">made deliberate.</span>
          </h1>
          <p data-login-reveal className="mt-6 max-w-lg text-base leading-7 text-slate-300">
            Move from client intake to attorney review in one structured, auditable workspace.
          </p>
          <ul data-login-reveal className="mt-9 grid gap-3 sm:grid-cols-3">
            {benefits.map(({ icon: Icon, label }) => (
              <li key={label} className="rounded-2xl border border-white/10 bg-white/[0.045] p-4 backdrop-blur-sm">
                <Icon className="mb-3 size-4 text-amber-300" aria-hidden="true" />
                <span className="text-xs leading-5 text-slate-300">{label}</span>
              </li>
            ))}
          </ul>
        </div>

        <p data-login-reveal className="text-xs text-slate-500">
          Internal staff access · Meridian DocGen
        </p>
      </section>

      <section className="relative flex min-h-screen items-center justify-center bg-background/95 px-4 py-10 sm:px-8 lg:bg-background">
        <ThemeToggle className="absolute right-4 top-4 border bg-card shadow-sm" />
        <div className="w-full max-w-md">
          <div data-login-reveal className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Scale className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold">Meridian DocGen</p>
              <p className="text-xs text-muted-foreground">Legal workspace</p>
            </div>
          </div>

          <div data-login-reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Staff portal</p>
            <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Sign in to continue to your document workspace.
            </p>
          </div>

          <SpotlightCard className="mt-8 p-6 sm:p-7" spotlightColor="color-mix(in oklch, var(--primary) 10%, transparent)">
            <form onSubmit={handleSubmit} className="space-y-5" data-login-reveal>
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@meridian.demo"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="h-10 bg-background/80"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="h-10 bg-background/80"
                />
              </div>
              {error && (
                <p role="alert" aria-live="polite" className="rounded-xl border border-destructive/15 bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="h-10 w-full shadow-sm" disabled={loading}>
                {loading ? "Signing in…" : "Sign in securely"}
              </Button>
            </form>
          </SpotlightCard>

          <div data-login-reveal className="mt-5 rounded-xl border border-dashed bg-muted/35 px-4 py-3 text-center text-xs leading-5 text-muted-foreground">
            Demo accounts use <code className="font-mono text-foreground">password123</code>
            <span className="block">admin@meridian.demo · attorney@meridian.demo · paralegal@meridian.demo</span>
          </div>
        </div>
      </section>
    </main>
  );
}
