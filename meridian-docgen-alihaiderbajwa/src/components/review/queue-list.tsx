"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const STATUS_VARIANT: Record<string, "secondary" | "outline" | "destructive"> = {
  draft: "secondary",
  under_review: "outline",
  changes_requested: "destructive",
};

export function QueueList() {
  const [rows, setRows] = useState<QueueRow[] | null>(null);
  const [filter, setFilter] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function fetchRows(status?: string) {
    let q = supabase
      .from("generated_documents")
      .select("id, status, created_at, template_id(name), client_id(name), created_by(name)")
      .order("created_at", { ascending: false });
    if (status) q = q.eq("status", status);
    else q = q.in("status", ["draft", "under_review", "changes_requested"]);
    const { data, error } = await q;
    return { data: (data ?? []) as unknown as QueueRow[], error };
  }

  useEffect(() => {
    let cancelled = false;
    fetchRows().then(({ data, error }) => {
      if (cancelled) return;
      if (error) {
        setError(error.message);
        return;
      }
      setRows(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleFilter(key: string) {
    setFilter(key);
    fetchRows(key || undefined).then(({ data, error }) => {
      if (error) {
        setError(error.message);
        return;
      }
      setRows(data);
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => handleFilter(f.key)}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              filter === f.key
                ? "border-primary bg-primary text-primary-foreground"
                : "bg-background hover:bg-muted",
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {rows === null ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing in the queue{filter ? ` (${filter.replace("_", " ")})` : ""}.
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Template</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created by</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Open</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">
                  {r.template_id?.name ?? "Unknown template"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.client_id?.name ?? "Unknown client"}
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[r.status] ?? "secondary"}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {r.created_by?.name ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(r.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <Link
                    href={`/documents/${r.id}`}
                    className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                  >
                    Open
                  </Link>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
