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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "@/lib/supabase";
import { useFocusRefresh } from "@/lib/use-focus-refresh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock3, Inbox, RefreshCw, TrendingUp } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";
import { EmptyState, InlineError, Skeleton, TableSkeleton } from "@/components/ui/states";

type MonthPoint = { month: string; count: number };
type TemplatePoint = { name: string; count: number };
type StatusPoint = { name: string; value: number; color: string };
type QueueRow = { id: string; name: string; client: string; status: string; created_at: string };

const STATUS_COLORS: Record<string, string> = {
  draft: "hsl(220 14% 60%)",
  under_review: "hsl(38 92% 50%)",
  changes_requested: "hsl(12 90% 58%)",
  approved: "hsl(142 70% 42%)",
  finalized: "hsl(220 90% 56%)",
};

const CARD_SHADOW = "shadow-[0_18px_50px_-34px_color-mix(in_oklch,var(--foreground)_38%,transparent)]";

const chartTooltipProps = {
  contentStyle: {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: 12,
    boxShadow: "0 18px 45px -30px rgba(0,0,0,0.35)",
  },
  labelStyle: { color: "var(--popover-foreground)", fontWeight: 600, marginBottom: 4 },
  itemStyle: { color: "var(--muted-foreground)" },
} as const;

const axisTick = { fill: "var(--muted-foreground)", fontSize: 12 } as const;

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

function formatDuration(ms: number): string {
  const h = Math.floor(ms / 3_600_000);
  const m = Math.round((ms % 3_600_000) / 60_000);
  return `${h}h ${m}m`;
}

export function ReportCards() {
  const [overTime, setOverTime] = useState<MonthPoint[] | null>(null);
  const [byTemplate, setByTemplate] = useState<TemplatePoint[] | null>(null);
  const [avgReview, setAvgReview] = useState<string | null>(null);
  const [queueCount, setQueueCount] = useState<number | null>(null);
  const [queueRows, setQueueRows] = useState<QueueRow[] | null>(null);
  const [byStatus, setByStatus] = useState<StatusPoint[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    const [docsRes, queueRes] = await Promise.all([
      supabase
        .from("generated_documents")
        .select(
          "id, status, created_at, finalized_at, template_id(name), client_id(name)",
        ),
      supabase
        .from("generated_documents")
        .select("id, status, created_at, template_id(name), client_id(name)", {
          count: "exact",
        })
        .in("status", ["draft", "under_review", "changes_requested"])
        .order("created_at", { ascending: true })
        .limit(5),
    ]);
    if (docsRes.error) {
      setError(docsRes.error.message);
      return;
    }
    if (queueRes.error) {
      setError(queueRes.error.message);
      return;
    }
    setError(null);

    const docs = (docsRes.data ?? []) as unknown as {
      status: string;
      created_at: string;
      finalized_at: string | null;
      template_id: { name: string } | null;
      client_id: { name: string } | null;
    }[];

    const buckets = lastSixMonths();
    const counts = new Map(buckets.map((b) => [b.key, 0]));
    docs.forEach((d) => {
      const key = (d.created_at as string).slice(0, 7);
      if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    setOverTime(
      buckets.map((b) => ({ month: b.label, count: counts.get(b.key) ?? 0 })),
    );

    const byName = new Map<string, number>();
    docs.forEach((d) => {
      const name = d.template_id?.name ?? "Unknown";
      byName.set(name, (byName.get(name) ?? 0) + 1);
    });
    setByTemplate(
      [...byName.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    );

    const finalized = docs.filter((d) => d.finalized_at);
    if (finalized.length === 0) {
      setAvgReview("No finalized documents yet");
    } else {
      const total = finalized.reduce((sum, d) => {
        return sum + (new Date(d.finalized_at as string).getTime() - new Date(d.created_at).getTime());
      }, 0);
      setAvgReview(formatDuration(total / finalized.length));
    }

    const statusCounts = new Map<string, number>();
    docs.forEach((d) => statusCounts.set(d.status, (statusCounts.get(d.status) ?? 0) + 1));
    setByStatus(
      [...statusCounts.entries()].map(([name, value]) => ({
        name: name.replace(/_/g, " "),
        value,
        color: STATUS_COLORS[name] ?? "hsl(220 14% 60%)",
      })),
    );

    setQueueCount(queueRes.count ?? 0);
    setQueueRows(
      (queueRes.data ?? []).map((d) => ({
        id: d.id,
        name: (d.template_id as { name?: string } | null)?.name ?? "Unknown",
        client: (d.client_id as { name?: string } | null)?.name ?? "—",
        status: d.status,
        created_at: d.created_at,
      })),
    );
  }

  useFocusRefresh(() => {
    load();
  });

  async function refresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={refresh} disabled={refreshing}>
          <RefreshCw className={refreshing ? "animate-spin" : ""} aria-hidden="true" />
          Refresh
        </Button>
      </div>

      {error && <InlineError message={error} />}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className={CARD_SHADOW}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-blue-500/10 text-blue-700 dark:text-blue-300">
                <TrendingUp className="size-4" aria-hidden="true" />
              </div>
              <CardTitle>Documents generated per month</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {overTime === null && !error ? (
              <Skeleton className="h-[240px] w-full rounded-xl" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={overTime ?? []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis dataKey="month" stroke="var(--border)" tick={axisTick} tickLine={false} />
                    <YAxis allowDecimals={false} stroke="var(--border)" tick={axisTick} tickLine={false} width={28} />
                    <Tooltip cursor={{ stroke: "var(--border)" }} {...chartTooltipProps} />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="var(--primary)"
                      strokeWidth={2.5}
                      dot={{ fill: "var(--card)", strokeWidth: 2 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
                {(overTime ?? []).every((p) => p.count === 0) && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    No documents yet
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className={CARD_SHADOW}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-700 dark:text-emerald-300">
                <TrendingUp className="size-4" aria-hidden="true" />
              </div>
              <CardTitle>Most-used templates</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {byTemplate === null && !error ? (
              <Skeleton className="h-[240px] w-full rounded-xl" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byTemplate ?? []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                    <XAxis type="number" allowDecimals={false} stroke="var(--border)" tick={axisTick} tickLine={false} />
                    <YAxis type="category" dataKey="name" width={130} stroke="var(--border)" tick={axisTick} tickLine={false} />
                    <Tooltip cursor={{ fill: "var(--muted)" }} {...chartTooltipProps} />
                    <Bar
                      dataKey="count"
                      fill="var(--primary)"
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
                {(byTemplate ?? []).length === 0 && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    No documents yet
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card className={CARD_SHADOW}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-amber-500/12 text-amber-700 dark:text-amber-300">
                <Clock3 className="size-4" aria-hidden="true" />
              </div>
              <CardTitle>Average time to finalize</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {avgReview === null && !error ? (
              <Skeleton className="h-[240px] w-full rounded-xl" />
            ) : (
              <div className="flex h-[240px] flex-col items-center justify-center">
                <p className="font-heading text-4xl font-semibold tracking-[-0.04em]">{avgReview}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  from finalized documents
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={CARD_SHADOW}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex size-9 items-center justify-center rounded-xl bg-violet-500/12 text-violet-700 dark:text-violet-300">
                <Inbox className="size-4" aria-hidden="true" />
              </div>
              <CardTitle>Status distribution</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {byStatus === null && !error ? (
              <Skeleton className="h-[240px] w-full rounded-xl" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={byStatus ?? []}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                    >
                      {(byStatus ?? []).map((s) => (
                        <Cell key={s.name} fill={s.color} stroke="var(--card)" strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip {...chartTooltipProps} />
                    <Legend wrapperStyle={{ fontSize: 12, color: "var(--muted-foreground)" }} />
                  </PieChart>
                </ResponsiveContainer>
                {(byStatus ?? []).length === 0 && (
                  <p className="mt-2 text-center text-xs text-muted-foreground">
                    No documents yet
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className={CARD_SHADOW}>
        <CardHeader>
          <CardTitle>
            Outstanding review queue{" "}
            {queueCount !== null && (
              <span className="ml-1 text-sm font-normal text-muted-foreground">
                ({queueCount} pending)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {queueRows === null && !error ? (
            <TableSkeleton rows={3} />
          ) : (queueRows ?? []).length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="Queue is clear"
              description="Nothing outstanding — every document is finalized."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Document</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(queueRows ?? []).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.client}</TableCell>
                    <TableCell>
                      <StatusBadge status={r.status} />
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(r.created_at).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
