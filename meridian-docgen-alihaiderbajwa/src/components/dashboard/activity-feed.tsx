"use client";

import { useState } from "react";
import { FileClock } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useFocusRefresh } from "@/lib/use-focus-refresh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineError, Skeleton } from "@/components/ui/states";

type ActivityRow = {
  id: string;
  status: string;
  created_at: string;
  template_id: { name: string } | null;
  client_id: { name: string } | null;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function ActivityFeed() {
  const [rows, setRows] = useState<ActivityRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("generated_documents")
      .select("id, status, created_at, template_id(name), client_id(name)")
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) {
      setError(error.message);
      return;
    }
    setError(null);
    setRows((data ?? []) as unknown as ActivityRow[]);
  }

  useFocusRefresh(() => {
    load();
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <InlineError message={error} />}
        {rows === null && !error ? (
          <div role="status" aria-label="Loading recent activity" className="space-y-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="space-y-2"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-24" /></div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
            <span className="sr-only">Loading…</span>
          </div>
        ) : rows && rows.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"><FileClock className="size-4" aria-hidden="true" /></div>
            <p className="mt-3 text-sm font-medium">No recent activity</p>
            <p className="mt-1 text-xs text-muted-foreground">Generated documents will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {rows?.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {r.template_id?.name ?? "Unknown template"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {r.client_id?.name ?? "Unknown client"} · {timeAgo(r.created_at)}
                  </p>
                </div>
                <StatusBadge status={r.status} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
