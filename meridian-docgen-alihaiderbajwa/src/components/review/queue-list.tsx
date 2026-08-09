"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { CalendarClock, Inbox } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { StatusBadge } from "@/components/ui/status-badge";
import { buttonVariants } from "@/components/ui/button";
import { EmptyState, InlineError, TableSkeleton } from "@/components/ui/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type QueueRow = {
  id: string;
  status: string;
  created_at: string;
  template_id: { name: string } | null;
  client_id: { name: string } | null;
  created_by: { name: string } | null;
};

const FILTERS = [
  { key: "", label: "All" },
  { key: "draft", label: "Draft" },
  { key: "under_review", label: "Under review" },
  { key: "changes_requested", label: "Changes requested" },
];

export function QueueList() {
  const [rows, setRows] = useState<QueueRow[] | null>(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("generated_documents")
      .select("id, status, created_at, template_id(name), client_id(name), created_by(name)")
      .in("status", ["draft", "under_review", "changes_requested"])
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else setRows((data ?? []) as unknown as QueueRow[]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleRows = useMemo(
    () => (filter ? (rows ?? []).filter((row) => row.status === filter) : rows ?? []),
    [filter, rows],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filter review queue">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            aria-pressed={filter === item.key}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/40",
              filter === item.key ? "border-primary bg-primary text-primary-foreground shadow-sm" : "bg-card hover:bg-muted",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      {error && <InlineError message={error} />}

      {rows === null && !error ? (
        <TableSkeleton />
      ) : visibleRows.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title="Nothing in this queue"
          description={filter ? `No documents currently have the “${filter.replaceAll("_", " ")}” status.` : "All pending review work is clear."}
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {visibleRows.map((row) => (
              <Link key={row.id} href={`/documents/${row.id}`} className="rounded-2xl border bg-card p-4 shadow-[0_18px_50px_-34px_color-mix(in_oklch,var(--foreground)_38%,transparent)] transition-all hover:-translate-y-0.5 hover:border-primary/20">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0"><p className="truncate font-heading text-sm font-semibold">{row.template_id?.name ?? "Unknown template"}</p><p className="mt-1 text-xs text-muted-foreground">{row.client_id?.name ?? "Unknown client"}</p></div>
                  <StatusBadge status={row.status} />
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3 text-xs text-muted-foreground">
                  <span>{row.created_by?.name ?? "Unassigned"}</span>
                  <span className="flex items-center gap-1.5"><CalendarClock className="size-3.5" aria-hidden="true" />{new Date(row.created_at).toLocaleDateString()}</span>
                </div>
              </Link>
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-[0_18px_50px_-34px_color-mix(in_oklch,var(--foreground)_38%,transparent)] md:block">
            <Table>
              <TableHeader><TableRow><TableHead>Template</TableHead><TableHead>Client</TableHead><TableHead>Status</TableHead><TableHead>Created by</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Open</TableHead></TableRow></TableHeader>
              <TableBody>
                {visibleRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.template_id?.name ?? "Unknown template"}</TableCell>
                    <TableCell className="text-muted-foreground">{row.client_id?.name ?? "Unknown client"}</TableCell>
                    <TableCell><StatusBadge status={row.status} /></TableCell>
                    <TableCell className="text-muted-foreground">{row.created_by?.name ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(row.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right"><Link href={`/documents/${row.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Open</Link></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
