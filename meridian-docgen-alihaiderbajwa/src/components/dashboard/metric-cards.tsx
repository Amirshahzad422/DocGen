"use client";

import { useState } from "react";
import { CalendarDays, FileStack, RefreshCw, ScanSearch } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useFocusRefresh } from "@/lib/use-focus-refresh";
import { CountUp } from "@/components/react-bits/count-up";
import { SpotlightCard } from "@/components/react-bits/spotlight-card";
import { Button } from "@/components/ui/button";
import { InlineError } from "@/components/ui/states";

type Counts = {
  templates: number | null;
  thisMonth: number | null;
  pending: number | null;
};

export function MetricCards() {
  const [counts, setCounts] = useState<Counts>({
    templates: null,
    thisMonth: null,
    pending: null,
  });
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    setRefreshing(true);
    const results = await Promise.all([
      supabase.from("document_templates").select("id", { count: "exact", head: true }),
      supabase
        .from("generated_documents")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString()),
      supabase
        .from("generated_documents")
        .select("id", { count: "exact", head: true })
        .in("status", ["draft", "under_review", "changes_requested"]),
    ]);
    setRefreshing(false);
    const anyErr = results.find((result) => result.error);
    if (anyErr) {
      setError(anyErr.error!.message);
      return;
    }
    setError(null);
    setCounts({
      templates: results[0].count ?? 0,
      thisMonth: results[1].count ?? 0,
      pending: results[2].count ?? 0,
    });
  }

  useFocusRefresh(() => {
    load();
  });

  const metrics = [
    {
      label: "Total templates",
      value: counts.templates,
      detail: "Ready for document generation",
      icon: FileStack,
      tone: "bg-blue-500/10 text-blue-700 dark:text-blue-300",
    },
    {
      label: "Documents this month",
      value: counts.thisMonth,
      detail: "Created since the first of the month",
      icon: CalendarDays,
      tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Pending review",
      value: counts.pending,
      detail: "Documents that still need attention",
      icon: ScanSearch,
      tone: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    },
  ];

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {metrics.map(({ label, value, detail, icon: Icon, tone }) => (
          <SpotlightCard key={label} className="min-h-40 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{label}</p>
                <p className="mt-3 font-heading text-4xl font-semibold tracking-[-0.04em]" aria-label={value === null ? `${label} loading` : `${label}: ${value}`}>
                  <CountUp value={value} />
                </p>
              </div>
              <div className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="size-5" aria-hidden="true" />
              </div>
            </div>
            <p className="mt-5 text-xs leading-5 text-muted-foreground">{detail}</p>
          </SpotlightCard>
        ))}
      </div>
      <div className="mt-3 flex min-h-8 flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" onClick={load} disabled={refreshing}>
          <RefreshCw className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
          {refreshing ? "Refreshing" : "Refresh metrics"}
        </Button>
        {error && <InlineError message={error} />}
      </div>
    </div>
  );
}
