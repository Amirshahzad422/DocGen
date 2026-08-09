"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { useFocusRefresh } from "@/lib/use-focus-refresh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineError, Skeleton } from "@/components/ui/states";

type MonthPoint = { month: string; count: number };
type TemplatePoint = { name: string; count: number };

function lastSixMonths(): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
      label: d.toLocaleString("en", { month: "short" }),
    });
  }
  return out;
}

export function Charts() {
  const [overTime, setOverTime] = useState<MonthPoint[] | null>(null);
  const [byTemplate, setByTemplate] = useState<TemplatePoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [timeRes, tplRes] = await Promise.all([
      supabase.from("generated_documents").select("created_at"),
      supabase.from("generated_documents").select("template_id(name)"),
    ]);
    if (timeRes.error) {
      setError(timeRes.error.message);
      return;
    }
    if (tplRes.error) {
      setError(tplRes.error.message);
      return;
    }
    setError(null);

    const buckets = lastSixMonths();
    const counts = new Map(buckets.map((b) => [b.key, 0]));
    (timeRes.data ?? []).forEach((d) => {
      const key = (d.created_at as string).slice(0, 7);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    setOverTime(
      buckets.map((b) => ({ month: b.label, count: counts.get(b.key) ?? 0 })),
    );

    const byName = new Map<string, number>();
    (tplRes.data ?? []).forEach((d) => {
      const name = (d.template_id as { name?: string } | null)?.name ?? "Unknown";
      byName.set(name, (byName.get(name) ?? 0) + 1);
    });
    setByTemplate(
      [...byName.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    );
  }

  useFocusRefresh(() => {
    load();
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Documents over time</CardTitle>
        </CardHeader>
        <CardContent>
          {error && <InlineError message={error} />}
          {overTime === null && !error ? (
            <Skeleton className="h-[260px] w-full rounded-xl" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={overTime ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="month" stroke="var(--border)" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} />
                  <YAxis allowDecimals={false} stroke="var(--border)" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} width={28} />
                  <Tooltip
                    cursor={{ stroke: "var(--border)" }}
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 18px 45px -30px rgba(0,0,0,0.35)" }}
                    labelStyle={{ color: "var(--popover-foreground)", fontWeight: 600, marginBottom: 4 }}
                    itemStyle={{ color: "var(--muted-foreground)" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="var(--chart-1)"
                    strokeWidth={2.5}
                    dot={{ fill: "var(--card)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              {(overTime ?? []).every((p) => p.count === 0) && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Your document trend will appear after the first draft is created
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Documents by template</CardTitle>
        </CardHeader>
        <CardContent>
          {byTemplate === null && !error ? (
            <Skeleton className="h-[260px] w-full rounded-xl" />
          ) : (
            <>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={byTemplate ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="name" stroke="var(--border)" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} />
                  <YAxis allowDecimals={false} stroke="var(--border)" tick={{ fill: "var(--muted-foreground)", fontSize: 12 }} tickLine={false} width={28} />
                  <Tooltip
                    cursor={{ fill: "var(--muted)" }}
                    contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, boxShadow: "0 18px 45px -30px rgba(0,0,0,0.35)" }}
                    labelStyle={{ color: "var(--popover-foreground)", fontWeight: 600, marginBottom: 4 }}
                    itemStyle={{ color: "var(--muted-foreground)" }}
                  />
                  <Bar
                    dataKey="count"
                    fill="var(--chart-1)"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
              {(byTemplate ?? []).length === 0 && (
                <p className="mt-2 text-center text-xs text-muted-foreground">
                  Template usage will appear after the first draft is created
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
