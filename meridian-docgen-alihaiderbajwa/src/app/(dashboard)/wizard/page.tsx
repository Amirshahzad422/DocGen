"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { cn } from "@/lib/utils";

type TemplateCard = {
  id: string;
  name: string;
  category: string;
  description: string | null;
  template_fields: { id: string }[];
};

type ClientOption = {
  id: string;
  name: string;
};

export default function WizardPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateCard[] | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [tplRes, cliRes] = await Promise.all([
        supabase
          .from("document_templates")
          .select("id, name, category, description, template_fields(id)")
          .eq("status", "active")
          .order("name"),
        supabase.from("clients").select("id, name").order("name"),
      ]);
      if (cancelled) return;
      if (tplRes.error) {
        setError(tplRes.error.message);
        return;
      }
      if (cliRes.error) {
        setError(cliRes.error.message);
        return;
      }
      setTemplates((tplRes.data ?? []) as TemplateCard[]);
      setClients((cliRes.data ?? []) as ClientOption[]);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  function start() {
    if (!selectedTemplate || !selectedClient) return;
    router.push(`/wizard/${selectedTemplate}?client=${selectedClient}`);
  }

  return (
    <>
      <PageHeader
        title="Document Wizard"
        description="Pick a template and a client to generate a document."
      />

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Step 1 — Choose a template</CardTitle>
          </CardHeader>
          <CardContent>
            {templates === null ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : templates.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No active templates — create one in the{" "}
                <Link
                  href="/templates"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Template Library
                </Link>
                .
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t.id)}
                    className={cn(
                      "rounded-lg border p-4 text-left transition-colors hover:bg-muted/60",
                      selectedTemplate === t.id &&
                        "border-primary bg-primary/5 ring-1 ring-primary",
                    )}
                  >
                    <p className="flex items-center justify-between gap-2 font-medium">
                      {t.name}
                      <Badge variant="secondary">{t.category}</Badge>
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t.description ?? "No description"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {t.template_fields?.length ?? 0} fields
                    </p>
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Step 2 — Choose a client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Select
              value={selectedClient ?? ""}
              onValueChange={(v) => setSelectedClient(v as string)}
            >
              <SelectTrigger className="w-full max-w-sm">
                <SelectValue placeholder="Select a client…" />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">
              New client?{" "}
              <Link
                href="/clients/new"
                className="text-primary underline-offset-4 hover:underline"
              >
                Create one here
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={start} disabled={!selectedTemplate || !selectedClient}>
            Start
          </Button>
        </div>
      </div>
    </>
  );
}
