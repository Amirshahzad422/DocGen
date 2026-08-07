"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

type TemplateRow = {
  id: string;
  name: string;
  category: string;
  status: string;
  created_at: string;
  template_fields: { id: string }[];
};

export function TemplateList() {
  const [templates, setTemplates] = useState<TemplateRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchTemplates(term?: string) {
    let q = supabase
      .from("document_templates")
      .select("id, name, category, status, created_at, template_fields(id)")
      .order("created_at", { ascending: false });
    if (term) q = q.ilike("name", `%${term}%`);
    const { data, error } = await q;
    return { data: (data ?? []) as TemplateRow[], error };
  }

  useEffect(() => {
    let cancelled = false;
    fetchTemplates().then(({ data, error }) => {
      if (cancelled) return;
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setTemplates(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSearch(v: string) {
    setSearch(v);
    setLoading(true);
    fetchTemplates(v).then(({ data, error }) => {
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setTemplates(data);
    });
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this template and its fields?")) return;
    const { error } = await supabase
      .from("document_templates")
      .delete()
      .eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setTemplates((prev) => (prev ?? []).filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Input
          placeholder="Search templates…"
          className="max-w-xs"
          value={search}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !templates || templates.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              No templates yet —{" "}
              <Link href="/templates/new" className="text-primary underline-offset-4 hover:underline">
                create your first template
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Fields</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-muted-foreground">{t.category}</TableCell>
                <TableCell>
                  <Badge variant={t.status === "active" ? "default" : "secondary"}>
                    {t.status}
                  </Badge>
                </TableCell>
                <TableCell>{t.template_fields?.length ?? 0}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(t.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/templates/${t.id}`}
                      className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
                    >
                      Edit
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(t.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
