"use client";

import { useState } from "react";
import { FileClock, MessageSquareText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useFocusRefresh } from "@/lib/use-focus-refresh";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { InlineError, Skeleton } from "@/components/ui/states";

type DocumentActivity = {
  kind: "document";
  id: string;
  status: string;
  createdAt: string;
  title: string;
  detail: string;
};

type CommentActivity = {
  kind: "comment";
  id: string;
  createdAt: string;
  title: string;
  detail: string;
};

type ActivityItem = DocumentActivity | CommentActivity;

type DocumentRow = {
  id: string;
  status: string;
  created_at: string;
  template_id: { name: string } | null;
  client_id: { name: string } | null;
};

type CommentRow = {
  id: string;
  created_at: string;
  staff_id: { name: string } | null;
  generated_document_id: {
    template_id: { name: string } | null;
    client_id: { name: string } | null;
  } | null;
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
  const [items, setItems] = useState<ActivityItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const [documentsResult, commentsResult] = await Promise.all([
      supabase
        .from("generated_documents")
        .select("id, status, created_at, template_id(name), client_id(name)")
        .order("created_at", { ascending: false })
        .limit(8),
      supabase
        .from("review_comments")
        .select("id, created_at, staff_id(name), generated_document_id(template_id(name), client_id(name))")
        .order("created_at", { ascending: false })
        .limit(8),
    ]);

    if (documentsResult.error || commentsResult.error) {
      setError(documentsResult.error?.message ?? commentsResult.error?.message ?? "Unable to load activity");
      return;
    }

    const documents = (documentsResult.data ?? []) as unknown as DocumentRow[];
    const comments = (commentsResult.data ?? []) as unknown as CommentRow[];
    const activity: ActivityItem[] = [
      ...documents.map((row): DocumentActivity => ({
        kind: "document",
        id: row.id,
        status: row.status,
        createdAt: row.created_at,
        title: row.template_id?.name ?? "Unknown template",
        detail: row.client_id?.name ?? "Unknown client",
      })),
      ...comments.map((row): CommentActivity => ({
        kind: "comment",
        id: row.id,
        createdAt: row.created_at,
        title: `Comment on ${row.generated_document_id?.template_id?.name ?? "document"}`,
        detail: `${row.staff_id?.name ?? "Staff"} · ${row.generated_document_id?.client_id?.name ?? "Unknown client"}`,
      })),
    ]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 8);

    setError(null);
    setItems(activity);
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
        {items === null && !error ? (
          <div role="status" aria-label="Loading recent activity" className="space-y-4">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex items-center justify-between gap-3">
                <div className="space-y-2"><Skeleton className="h-3.5 w-32" /><Skeleton className="h-3 w-24" /></div>
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            ))}
            <span className="sr-only">Loading…</span>
          </div>
        ) : items && items.length === 0 ? (
          <div className="flex min-h-44 flex-col items-center justify-center text-center">
            <div className="flex size-10 items-center justify-center rounded-xl bg-muted text-muted-foreground"><FileClock className="size-4" aria-hidden="true" /></div>
            <p className="mt-3 text-sm font-medium">No recent activity</p>
            <p className="mt-1 text-xs text-muted-foreground">Documents and review comments will appear here.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {items?.map((item) => (
              <li key={`${item.kind}-${item.id}`} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                    {item.kind === "comment" && <MessageSquareText className="size-3.5 shrink-0 text-primary" aria-hidden="true" />}
                    <span className="truncate">{item.title}</span>
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{item.detail} · {timeAgo(item.createdAt)}</p>
                </div>
                {item.kind === "document" ? <StatusBadge status={item.status} /> : <Badge variant="secondary">Comment</Badge>}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
