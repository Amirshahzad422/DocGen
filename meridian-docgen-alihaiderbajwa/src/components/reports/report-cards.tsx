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
import { RefreshCw } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge } from "@/components/ui/status-badge";

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
          <RefreshCw className={`mr-2 h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Documents generated per month</CardTitle>
          </CardHeader>
          <CardContent>
            {overTime === null && !error ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={overTime ?? []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="count"
                      stroke="hsl(var(--primary))"
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

        <Card>
          <CardHeader>
            <CardTitle>Most-used templates</CardTitle>
          </CardHeader>
          <CardContent>
            {byTemplate === null && !error ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={byTemplate ?? []} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" allowDecimals={false} />
                    <YAxis type="category" dataKey="name" width={130} />
                    <Tooltip />
                    <Bar
                      dataKey="count"
                      fill="hsl(var(--primary))"
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

        <Card>
          <CardHeader>
            <CardTitle>Average time to finalize</CardTitle>
          </CardHeader>
          <CardContent>
            {avgReview === null && !error ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="flex h-[240px] flex-col items-center justify-center">
                <p className="text-4xl font-semibold">{avgReview}</p>
                <p className="mt-2 text-xs text-muted-foreground">
                  from finalized documents
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Status distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {byStatus === null && !error ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
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
                        <Cell key={s.name} fill={s.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
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

      <Card>
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
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (queueRows ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nothing in the queue — all documents are finalized.
            </p>
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
