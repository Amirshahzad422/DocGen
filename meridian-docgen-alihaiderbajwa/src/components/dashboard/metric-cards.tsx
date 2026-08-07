"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useFocusRefresh } from "@/lib/use-focus-refresh";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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

  async function load() {
    const results = await Promise.all([
      supabase
        .from("document_templates")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("generated_documents")
        .select("id", { count: "exact", head: true })
        .gte(
          "created_at",
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
        ),
      supabase
        .from("generated_documents")
        .select("id", { count: "exact", head: true })
        .in("status", ["draft", "under_review", "changes_requested"]),
    ]);
    const anyErr = results.find((r) => r.error);
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

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardDescription>Total templates</CardDescription>
            <CardTitle className="text-2xl">
              {counts.templates ?? "—"}
            </CardTitle>
            <p className="text-xs text-muted-foreground">from document_templates</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Documents this month</CardDescription>
            <CardTitle className="text-2xl">{counts.thisMonth ?? "—"}</CardTitle>
            <p className="text-xs text-muted-foreground">from generated_documents</p>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardDescription>Pending review</CardDescription>
            <CardTitle className="text-2xl">{counts.pending ?? "—"}</CardTitle>
            <p className="text-xs text-muted-foreground">
              draft + under_review + changes_requested
            </p>
          </CardHeader>
        </Card>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={load}>
          Refresh
        </Button>
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
