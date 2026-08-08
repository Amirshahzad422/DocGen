"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Check, FilePenLine, Sparkles } from "lucide-react";
import { gsap } from "gsap";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { mergeTemplate, slugifyLabel } from "@/lib/merge";
import { type FieldType } from "@/lib/template-types";
import { InlineError, Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";

type WizardField = {
  id: string;
  label: string;
  field_type: FieldType;
  options: string[];
  required: boolean;
  sort_order: number;
};

type LoadedTemplate = {
  id: string;
  name: string;
  body: string;
};

const STEP_SIZE = 3;

export default function WizardFormPage() {
  const params = useParams<{ templateId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const clientId = searchParams.get("client") ?? "";

  const [template, setTemplate] = useState<LoadedTemplate | null>(null);
  const [clientName, setClientName] = useState("");
  const [fields, setFields] = useState<WizardField[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [step, setStep] = useState(0);
  const [stepError, setStepError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!clientId) {
        setLoadError("Choose a client before starting the wizard.");
        setLoading(false);
        return;
      }

      const [tplRes, cliRes] = await Promise.all([
        supabase
          .from("document_templates")
          .select("id, name, body")
          .eq("id", params.templateId)
          .eq("status", "active")
          .single(),
        supabase.from("clients").select("name").eq("id", clientId).single(),
      ]);
      if (cancelled) return;
      if (tplRes.error || !tplRes.data) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      if (cliRes.error || !cliRes.data) {
        setLoadError("The selected client does not exist or is unavailable.");
        setLoading(false);
        return;
      }
      setTemplate(tplRes.data as LoadedTemplate);
      setClientName(cliRes.data.name as string);

      const { data: fieldRows, error: fErr } = await supabase
        .from("template_fields")
        .select("id, label, field_type, options, required, sort_order")
        .eq("template_id", params.templateId)
        .order("sort_order");
      if (cancelled) return;
      if (fErr) {
        setLoadError(fErr.message);
        setLoading(false);
        return;
      }
      setFields((fieldRows ?? []) as WizardField[]);
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.templateId, clientId]);

  const steps = useMemo(() => {
    const out: WizardField[][] = [];
    for (let i = 0; i < fields.length; i += STEP_SIZE) {
      out.push(fields.slice(i, i + STEP_SIZE));
    }
    return out;
  }, [fields]);

  useLayoutEffect(() => {
    if (!panelRef.current) return;
    const mm = gsap.matchMedia(panelRef);
    mm.add({ reduceMotion: "(prefers-reduced-motion: reduce)" }, (context) => {
      if (context.conditions?.reduceMotion) return;
      gsap.fromTo(
        ":scope > *",
        { autoAlpha: 0, x: 12 },
        { autoAlpha: 1, x: 0, duration: 0.42, stagger: 0.045, ease: "power3.out", clearProps: "transform,opacity,visibility" },
      );
    });
    return () => mm.revert();
  }, [step]);

  function validateStep(stepFields: WizardField[]): string | null {
    for (const f of stepFields) {
      const value = (answers[f.id] ?? "").trim();
      if (!f.required && !value) continue;
      if (f.required && !value) return `"${f.label}" is required`;
      if (f.field_type === "date" && Number.isNaN(Date.parse(value))) {
        return `"${f.label}" must be a valid date`;
      }
      if (f.field_type === "number" && Number.isNaN(Number(value))) {
        return `"${f.label}" must be a number`;
      }
      if (
        f.field_type === "select" &&
        f.options.length > 0 &&
        !f.options.includes(value)
      ) {
        return `"${f.label}" must be one of: ${f.options.join(", ")}`;
      }
    }
    return null;
  }

  function next() {
    const err = validateStep(steps[step] ?? []);
    if (err) {
      setStepError(err);
      return;
    }
    setStepError(null);
    setStep((s) => s + 1);
  }

  function back() {
    setStepError(null);
    setStep((s) => Math.max(0, s - 1));
  }

  function renderField(f: WizardField) {
    const value = answers[f.id] ?? "";
    const set = (v: string) =>
      setAnswers((a) => ({ ...a, [f.id]: v }));

    if (f.field_type === "textarea") {
      return (
        <Textarea
          id={f.id}
          name={f.id}
          rows={4}
          placeholder="Your answer…"
          value={value}
          required={f.required}
          onChange={(e) => set(e.target.value)}
        />
      );
    }
    if (f.field_type === "select") {
      return (
        <Select value={value} onValueChange={(v) => set(v as string)}>
          <SelectTrigger id={f.id} className="h-10 w-full">
            <SelectValue placeholder="Select…" />
          </SelectTrigger>
          <SelectContent>
            {f.options.map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <Input
        id={f.id}
        name={f.id}
        type={f.field_type === "date" ? "date" : f.field_type === "number" ? "number" : "text"}
        placeholder="Your answer…"
        required={f.required}
        className="h-10"
        value={value}
        onChange={(e) => set(e.target.value)}
      />
    );
  }

  async function handleSubmit() {
    const err = validateStep(steps[steps.length - 1] ?? []);
    if (err) {
      setStepError(err);
      return;
    }
    setSubmitError(null);
    setSaving(true);
    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        setSubmitError("Your session has expired. Sign in and try again.");
        return;
      }

      const { data: staffRow, error: staffError } = await supabase
        .from("staff")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (staffError || !staffRow) {
        setSubmitError("Your account is not linked to an active staff profile.");
        return;
      }

      const field_values: Record<string, string> = {};
      const mergeValues: Record<string, string> = {};
      fields.forEach((f) => {
        const answer = (answers[f.id] ?? "").trim();
        field_values[f.label] = answer;
        mergeValues[slugifyLabel(f.label)] = answer;
      });

      const { data: doc, error: insErr } = await supabase
        .from("generated_documents")
        .insert({
          template_id: params.templateId,
          client_id: clientId,
          created_by: staffRow.id,
          field_values,
          content: mergeTemplate(template?.body ?? "", mergeValues),
          status: "draft",
        })
        .select("id")
        .single();
      if (insErr) {
        setSubmitError(insErr.message);
        return;
      }
      router.push(`/documents/${doc.id}`);
      router.refresh();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  if (notFound) {
    return (
      <>
        <PageHeader title="Template not found" />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              This template does not exist or is inactive.{" "}
              <Button variant="outline" size="sm" onClick={() => router.push("/wizard")}>
                Back to wizard
              </Button>
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (loading) {
    return <div role="status" aria-label="Loading document wizard" className="max-w-3xl space-y-4"><Skeleton className="h-8 w-56" /><Skeleton className="h-3 w-80" /><Skeleton className="h-2 w-full rounded-full" /><Skeleton className="h-80 w-full rounded-2xl" /><span className="sr-only">Loading…</span></div>;
  }

  if (loadError || !template) {
    return (
      <>
        <PageHeader title="Unable to start wizard" />
        <Card>
          <CardContent className="space-y-4 pt-6">
            <p className="text-sm text-destructive">
              {loadError ?? "The template could not be loaded."}
            </p>
            <Button variant="outline" onClick={() => router.push("/wizard")}>
              Back to wizard
            </Button>
          </CardContent>
        </Card>
      </>
    );
  }

  const isReview = step >= steps.length;

  return (
    <>
      <PageHeader
        title={template.name}
        description={`Client: ${clientName || "Unknown"} — complete the guided interview, review your answers, then generate the draft.`}
      />

      <div className="mb-5 max-w-3xl" aria-label={`Wizard progress: ${isReview ? "review" : `step ${step + 1}`} of ${steps.length + 1}`}>
        <div className="mb-2 flex items-center justify-between text-xs"><span className="font-medium text-foreground">{isReview ? "Final review" : `Interview ${step + 1} of ${steps.length}`}</span><span className="text-muted-foreground">{Math.round(((Math.min(step, steps.length) + 1) / (steps.length + 1)) * 100)}% complete</span></div>
        <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-[width] duration-300" style={{ width: `${((Math.min(step, steps.length) + 1) / (steps.length + 1)) * 100}%` }} /></div>
        <ol className="mt-3 flex gap-1.5" aria-hidden="true">{Array.from({ length: steps.length + 1 }, (_, index) => <li key={index} className={cn("h-1 flex-1 rounded-full", index <= step ? "bg-primary/60" : "bg-muted")} />)}</ol>
      </div>

      <Card className="max-w-3xl shadow-[0_20px_55px_-40px_color-mix(in_oklch,var(--foreground)_45%,transparent)]">
        <CardHeader>
          <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl bg-primary/[0.08] text-primary">{isReview ? <Sparkles className="size-4" aria-hidden="true" /> : <FilePenLine className="size-4" aria-hidden="true" />}</div><div><p className="text-xs font-medium text-muted-foreground">{isReview ? "Ready to generate" : `${(steps[step] ?? []).length} questions`}</p><CardTitle>{isReview ? "Review your answers" : `Document details · ${step + 1}`}</CardTitle></div></div>
        </CardHeader>
        <CardContent ref={panelRef} className="space-y-5">
          {!isReview &&
            (steps[step] ?? []).map((f) => (
              <div key={f.id} className="space-y-2 rounded-xl border bg-muted/[0.18] p-4">
                <Label htmlFor={f.id}>
                  {f.label}
                  {f.required && <span className="ml-1 text-destructive" aria-label="required">*</span>}
                </Label>
                {renderField(f)}
                <p className="text-[0.7rem] text-muted-foreground">{f.required ? "Required" : "Optional"} · {f.field_type === "textarea" ? "Long answer" : f.field_type}</p>
              </div>
            ))}

          {isReview && (
            <div className="space-y-2">
              {fields.map((f) => (
                <div
                  key={f.id}
                  className="flex flex-col gap-1 rounded-xl border bg-muted/[0.18] px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-3"
                >
                  <span className="flex items-center gap-2 text-sm font-medium"><Check className="size-3.5 text-primary" aria-hidden="true" />{f.label}</span>
                  <span className="break-words text-sm text-muted-foreground sm:max-w-[55%] sm:text-right">
                    {(answers[f.id] ?? "").trim() || "—"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {stepError && <InlineError message={stepError} />}
          {submitError && <InlineError message={submitError} />}

          <div className="flex justify-between border-t pt-5">
            <Button variant="outline" onClick={back} disabled={step === 0}>
              Back
            </Button>
            {isReview ? (
              <Button size="lg" onClick={handleSubmit} disabled={saving}>
                <Sparkles aria-hidden="true" />{saving ? "Generating…" : "Generate document"}
              </Button>
            ) : (
              <Button onClick={next}>Next</Button>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
