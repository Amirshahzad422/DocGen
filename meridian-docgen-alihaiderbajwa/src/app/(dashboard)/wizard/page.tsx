"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, FileText, Layers3, UserRound, UserRoundPlus, WandSparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import { SpotlightCard } from "@/components/react-bits/spotlight-card";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState, InlineError, Skeleton } from "@/components/ui/states";
import { PageHeader } from "@/components/ui/page-header";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type TemplateCard = { id: string; name: string; category: string; description: string | null; template_fields: { id: string }[] };
type ClientOption = { id: string; name: string };

export default function WizardPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<TemplateCard[] | null>(null);
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      supabase.from("document_templates").select("id, name, category, description, template_fields(id)").eq("status", "active").order("name"),
      supabase.from("clients").select("id, name").order("name"),
    ]).then(([templateResult, clientResult]) => {
      if (cancelled) return;
      if (templateResult.error || clientResult.error) {
        setError(templateResult.error?.message ?? clientResult.error?.message ?? "Unable to load the wizard");
        return;
      }
      setTemplates((templateResult.data ?? []) as TemplateCard[]);
      setClients((clientResult.data ?? []) as ClientOption[]);
    });
    return () => { cancelled = true; };
  }, []);

  const selectedTemplateData = templates?.find((template) => template.id === selectedTemplate);
  const selectedClientData = clients.find((client) => client.id === selectedClient);
  const ready = Boolean(selectedTemplate && selectedClient);

  function start() {
    if (selectedTemplate && selectedClient) router.push(`/wizard/${selectedTemplate}?client=${selectedClient}`);
  }

  return (
    <>
      <PageHeader title="Document Wizard" description="Choose the source template and client before completing the guided document interview." />

      <ol className="mb-6 grid grid-cols-3 overflow-hidden rounded-2xl border bg-card shadow-sm" aria-label="Document generation progress">
        {[{ label: "Template", done: Boolean(selectedTemplate) }, { label: "Client", done: Boolean(selectedClient) }, { label: "Interview", done: false }].map((item, index) => (
          <li key={item.label} className={cn("flex items-center gap-2 border-r px-3 py-3 text-xs font-medium last:border-r-0 sm:px-4", (item.done || (index === 0 && !selectedTemplate) || (index === 1 && selectedTemplate && !selectedClient) || (index === 2 && ready)) ? "text-primary" : "text-muted-foreground")}>
            <span className={cn("flex size-6 shrink-0 items-center justify-center rounded-full border text-[0.68rem]", item.done ? "border-primary bg-primary text-primary-foreground" : "bg-muted")}>{item.done ? <Check className="size-3" aria-hidden="true" /> : index + 1}</span>
            <span className="hidden sm:inline">{item.label}</span>
          </li>
        ))}
      </ol>

      {error && <InlineError message={error} />}

      <div className="space-y-5">
        <section aria-labelledby="choose-template-heading">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/65">Step 1</p><h2 id="choose-template-heading" className="mt-1 font-heading text-lg font-semibold">Choose a template</h2></div>
            {selectedTemplateData && <Badge variant="secondary"><Check aria-hidden="true" /> Selected</Badge>}
          </div>
          {templates === null && !error ? (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 3 }, (_, index) => <Skeleton key={index} className="h-40 rounded-2xl" />)}</div>
          ) : templates?.length === 0 ? (
            <EmptyState icon={FileText} title="No active templates" description="Create and activate a template before starting a document." action={<Link href="/templates/new" className={cn(buttonVariants())}>Create template</Link>} />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {templates?.map((template) => {
                const selected = selectedTemplate === template.id;
                return (
                  <SpotlightCard key={template.id} className={cn("transition-all", selected && "border-primary ring-2 ring-primary/15")}>
                    <button type="button" aria-pressed={selected} onClick={() => setSelectedTemplate(template.id)} className="flex h-full min-h-40 w-full flex-col p-5 text-left focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-inset focus-visible:ring-ring/40">
                      <div className="flex items-start justify-between gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-primary/[0.08] text-primary"><FileText className="size-4" aria-hidden="true" /></div>{selected ? <span className="flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground"><Check className="size-3.5" aria-hidden="true" /></span> : <Badge variant="secondary">{template.category}</Badge>}</div>
                      <p className="mt-4 font-heading text-sm font-semibold">{template.name}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{template.description ?? "A reusable legal document template."}</p>
                      <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-muted-foreground"><Layers3 className="size-3.5" aria-hidden="true" />{template.template_fields?.length ?? 0} interview fields</p>
                    </button>
                  </SpotlightCard>
                );
              })}
            </div>
          )}
        </section>

        <Card className={cn("transition-opacity", !selectedTemplate && "opacity-70")}>
          <CardHeader><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/65">Step 2</p><CardTitle className="mt-1 text-lg">Choose a client</CardTitle></div></CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full max-w-md space-y-2"><Select value={selectedClient ?? ""} onValueChange={(value) => setSelectedClient(value as string)}><SelectTrigger className="h-10 w-full bg-background"><UserRound className="text-muted-foreground" aria-hidden="true" /><SelectValue placeholder="Select a client…" /></SelectTrigger><SelectContent>{clients.map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">The generated document will be saved to this client’s history.</p></div>
            <Link href="/clients/new" className={cn(buttonVariants({ variant: "outline" }))}><UserRoundPlus aria-hidden="true" /> New client</Link>
          </CardContent>
        </Card>

        <div className="sticky bottom-4 z-20 flex flex-col gap-3 rounded-2xl border bg-card/95 p-4 shadow-xl backdrop-blur-xl sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">Ready to begin</p><p className="truncate text-sm font-semibold">{selectedTemplateData?.name ?? "Choose a template"} <span className="font-normal text-muted-foreground">for</span> {selectedClientData?.name ?? "a client"}</p></div>
          <Button size="lg" onClick={start} disabled={!ready}><WandSparkles aria-hidden="true" /> Start interview <ArrowRight aria-hidden="true" /></Button>
        </div>
      </div>
    </>
  );
}
