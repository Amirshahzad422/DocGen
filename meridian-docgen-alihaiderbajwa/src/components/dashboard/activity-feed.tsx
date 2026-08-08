"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useFocusRefresh } from "@/lib/use-focus-refresh";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";

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
        {error && (
          <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}
        {rows === null && !error ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rows && rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No documents generated yet.
          </p>
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
