"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FilePlus2, Files, Layers3 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState, InlineError, TableSkeleton } from "@/components/ui/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

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
  const [searching, setSearching] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    let cancelled = false;
    let query = supabase
      .from("document_templates")
      .select("id, name, category, status, created_at, template_fields(id)")
      .order("created_at", { ascending: false })
    const term = debouncedSearch.trim();
    if (term) {
      const escaped = term.replace(/[(),]/g, " ");
      query = query.or(`name.ilike.%${escaped}%,category.ilike.%${escaped}%,status.ilike.%${escaped}%`);
    }
    query.then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else {
          setError(null);
          setTemplates((data ?? []) as TemplateRow[]);
        }
        setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const visibleTemplates = templates ?? [];

  async function handleDelete(id: string) {
    if (!confirm("Delete this template and its fields?")) return;
    const { error } = await supabase.from("document_templates").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }
    setTemplates((previous) => (previous ?? []).filter((template) => template.id !== id));
  }

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Search templates, categories, or status…"
        value={search}
        aria-busy={searching}
        onChange={(event) => {
          setSearch(event.target.value);
          setSearching(true);
        }}
      />
      {error && <InlineError message={error} />}

      {templates === null && !error ? (
        <TableSkeleton />
      ) : visibleTemplates.length === 0 ? (
        <EmptyState
          icon={search ? Files : FilePlus2}
          title={search ? "No matching templates" : "No templates yet"}
          description={search ? "Try searching by name, category, or status." : "Create a reusable template to standardize the firm's document workflows."}
          action={!search ? <Link href="/templates/new" className={cn(buttonVariants())}><FilePlus2 aria-hidden="true" /> New template</Link> : undefined}
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {visibleTemplates.map((template) => (
              <div key={template.id} className="rounded-2xl border bg-card p-4 shadow-[0_18px_50px_-34px_color-mix(in_oklch,var(--foreground)_38%,transparent)] transition-all hover:-translate-y-0.5">
                <div className="flex items-start justify-between gap-3">
                  <div><p className="font-heading text-sm font-semibold">{template.name}</p><p className="mt-1 text-xs text-muted-foreground">{template.category}</p></div>
                  <Badge variant={template.status === "active" ? "default" : "secondary"}>{template.status}</Badge>
                </div>
                <div className="mt-4 flex items-center justify-between border-t pt-3">
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground"><Layers3 className="size-3.5" aria-hidden="true" />{template.template_fields?.length ?? 0} fields</span>
                  <div className="flex gap-2">
                    <Link href={`/templates/${template.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Edit</Link>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(template.id)}>Delete</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-[0_18px_50px_-34px_color-mix(in_oklch,var(--foreground)_38%,transparent)] md:block">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead><TableHead>Fields</TableHead><TableHead>Created</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
              <TableBody>
                {visibleTemplates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell className="text-muted-foreground">{template.category}</TableCell>
                    <TableCell><Badge variant={template.status === "active" ? "default" : "secondary"}>{template.status}</Badge></TableCell>
                    <TableCell>{template.template_fields?.length ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(template.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-right"><div className="flex justify-end gap-2"><Link href={`/templates/${template.id}`} className={cn(buttonVariants({ variant: "outline", size: "sm" }))}>Edit</Link><Button variant="destructive" size="sm" onClick={() => handleDelete(template.id)}>Delete</Button></div></TableCell>
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
