"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, FileText, LockKeyhole, Scale, ShieldCheck } from "lucide-react";
import { gsap } from "gsap";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ThemeToggle } from "@/components/ui/theme-toggle";

const benefits = [
  "Guided drafting from approved templates",
  "Clear review and approval workflows",
  "One organized record for every client",
];

export default function LoginPage() {
  const router = useRouter();
  const pageRef = useRef<HTMLElement>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useLayoutEffect(() => {
    const mm = gsap.matchMedia(pageRef);
    mm.add({ reduceMotion: "(prefers-reduced-motion: reduce)" }, (context) => {
      if (context.conditions?.reduceMotion) return;
      gsap.fromTo(
        "[data-login-reveal]",
        { autoAlpha: 0, y: 16 },
        { autoAlpha: 1, y: 0, duration: 0.65, stagger: 0.07, ease: "power3.out", clearProps: "transform,opacity,visibility" },
      );
      gsap.fromTo(
        "[data-document-sheet]",
        { autoAlpha: 0, y: 24, rotate: -2 },
        { autoAlpha: 1, y: 0, rotate: 0, duration: 0.8, stagger: 0.09, ease: "power3.out", delay: 0.18 },
      );
    });
    return () => mm.revert();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      const invalidCredentials = error.message.toLowerCase().includes("invalid login");
      setError(invalidCredentials ? "The email or password is incorrect." : "We couldn’t sign you in. Try again or contact your administrator.");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main ref={pageRef} className="relative min-h-screen overflow-hidden bg-[#eef1f5] p-3 text-slate-950 sm:p-5 lg:p-7 dark:bg-slate-950 dark:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_12%,rgba(54,83,128,0.13),transparent_28rem),radial-gradient(circle_at_88%_90%,rgba(179,142,64,0.1),transparent_26rem)]" />

      <div className="relative mx-auto flex min-h-[calc(100vh-1.5rem)] max-w-[94rem] flex-col overflow-hidden rounded-[1.75rem] border border-white/60 bg-white shadow-[0_30px_90px_-45px_rgba(15,23,42,0.38)] sm:min-h-[calc(100vh-2.5rem)] lg:grid lg:grid-cols-[1.08fr_0.92fr] dark:border-white/10 dark:bg-slate-900">
        <section className="relative hidden overflow-hidden bg-[#10233f] p-10 text-white lg:flex lg:flex-col lg:justify-between xl:p-14">
          <div className="pointer-events-none absolute -right-28 -top-28 size-[28rem] rounded-full border border-white/[0.06]" />
          <div className="pointer-events-none absolute -right-14 -top-14 size-[20rem] rounded-full border border-white/[0.06]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,transparent_55%,rgba(255,255,255,0.035))]" />

          <div data-login-reveal className="relative flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-xl bg-[#d5b069] text-[#10233f] shadow-lg shadow-black/10">
              <Scale className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold tracking-wide">Meridian Legal Group</p>
              <p className="mt-0.5 text-xs text-slate-400">Document workspace</p>
            </div>
          </div>

          <div className="relative grid items-center gap-10 xl:grid-cols-[1fr_0.75fr]">
            <div>
              <p data-login-reveal className="text-xs font-semibold uppercase tracking-[0.22em] text-[#d5b069]">Draft. Review. Finalize.</p>
              <h1 data-login-reveal className="mt-5 max-w-xl font-heading text-5xl font-semibold leading-[1.04] tracking-[-0.04em] xl:text-6xl">
                Focus on the counsel,
                <span className="block text-slate-400">not the paperwork.</span>
              </h1>
              <p data-login-reveal className="mt-6 max-w-lg text-[0.95rem] leading-7 text-slate-300">
                A focused workspace for preparing consistent legal drafts and moving them through review with confidence.
              </p>
              <ul data-login-reveal className="mt-8 space-y-3">
                {benefits.map((benefit) => (
                  <li key={benefit} className="flex items-center gap-3 text-sm text-slate-300">
                    <span className="flex size-5 items-center justify-center rounded-full bg-white/10 text-[#d5b069]"><Check className="size-3" aria-hidden="true" /></span>
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="relative hidden min-h-80 xl:block" aria-hidden="true">
              <div data-document-sheet className="absolute left-10 top-7 h-64 w-48 rotate-6 rounded-2xl border border-white/10 bg-white/[0.07] shadow-2xl backdrop-blur" />
              <div data-document-sheet className="absolute left-0 top-0 h-72 w-52 -rotate-3 rounded-2xl border border-white/10 bg-[#f8f5ee] p-5 text-slate-900 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 pb-4"><div className="flex size-8 items-center justify-center rounded-lg bg-[#10233f] text-white"><FileText className="size-4" /></div><span className="rounded-full bg-emerald-100 px-2 py-1 text-[0.55rem] font-semibold uppercase tracking-wide text-emerald-700">Ready</span></div>
                <div className="mt-5 h-3 w-24 rounded-full bg-slate-800" />
                <div className="mt-3 h-1.5 w-full rounded-full bg-slate-200" /><div className="mt-2 h-1.5 w-5/6 rounded-full bg-slate-200" /><div className="mt-2 h-1.5 w-11/12 rounded-full bg-slate-200" />
                <div className="mt-7 rounded-xl border border-slate-200 bg-white p-3"><div className="h-1.5 w-16 rounded-full bg-slate-300" /><div className="mt-3 h-2 w-28 rounded-full bg-slate-700" /></div>
                <div className="mt-5 flex items-center gap-2 text-[0.58rem] font-medium text-slate-500"><ShieldCheck className="size-3 text-[#a67d31]" /> Attorney reviewed</div>
              </div>
            </div>
          </div>

          <p data-login-reveal className="relative text-xs text-slate-500">Private workspace for authorized staff</p>
        </section>

        <section className="relative flex min-h-[calc(100vh-1.5rem)] items-center justify-center px-5 py-16 sm:min-h-[calc(100vh-2.5rem)] sm:px-10 lg:min-h-0 xl:px-16">
          <ThemeToggle className="absolute right-5 top-5 border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-slate-800" />
          <div className="w-full max-w-[26rem]">
            <div data-login-reveal className="mb-10 flex items-center gap-3 lg:hidden">
              <div className="flex size-11 items-center justify-center rounded-xl bg-[#10233f] text-[#d5b069] dark:bg-white dark:text-slate-900"><Scale className="size-5" aria-hidden="true" /></div>
              <div><p className="font-heading text-sm font-semibold">Meridian Legal Group</p><p className="text-xs text-muted-foreground">Document workspace</p></div>
            </div>

            <div data-login-reveal>
              <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/[0.08] text-primary"><LockKeyhole className="size-5" aria-hidden="true" /></div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">Secure staff access</p>
              <h2 className="mt-3 font-heading text-4xl font-semibold tracking-[-0.035em]">Welcome back</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Enter your work credentials to continue.</p>
            </div>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" data-login-reveal>
              <div className="space-y-2"><Label htmlFor="email">Work email</Label><Input id="email" type="email" autoComplete="email" inputMode="email" placeholder="name@meridian.com" value={email} onChange={(event) => setEmail(event.target.value)} required className="h-11 bg-background px-3.5 shadow-sm" /></div>
              <div className="space-y-2"><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label><span className="text-xs text-muted-foreground">Case sensitive</span></div><Input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required className="h-11 bg-background px-3.5 shadow-sm" /></div>
              {error && <p role="alert" aria-live="polite" className="rounded-xl border border-destructive/15 bg-destructive/[0.06] px-3.5 py-3 text-sm text-destructive">{error}</p>}
              <Button type="submit" size="lg" className="h-11 w-full justify-between px-4 shadow-sm" disabled={loading}><span>{loading ? "Signing in…" : "Continue to workspace"}</span><ArrowRight aria-hidden="true" /></Button>
            </form>

            <div data-login-reveal className="mt-8 flex items-start gap-3 border-t pt-6 text-xs leading-5 text-muted-foreground"><ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" /><p>Access is limited to authorized firm personnel. Contact your administrator if you need an account.</p></div>
          </div>
        </section>
      </div>
    </main>
  );
}
