"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
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

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [tplRes, cliRes] = await Promise.all([
        supabase
          .from("document_templates")
          .select("id, name, body")
          .eq("id", params.templateId)
          .single(),
        supabase.from("clients").select("name").eq("id", clientId).single(),
      ]);
      if (cancelled) return;
      if (tplRes.error || !tplRes.data) {
        setNotFound(true);
        return;
      }
      setTemplate(tplRes.data as LoadedTemplate);
      setClientName(cliRes.error ? "" : (cliRes.data.name as string));

      const { data: fieldRows, error: fErr } = await supabase
        .from("template_fields")
        .select("id, label, field_type, options, required, sort_order")
        .eq("template_id", params.templateId)
        .order("sort_order");
      if (cancelled) return;
      if (!fErr) setFields((fieldRows ?? []) as WizardField[]);
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
          rows={4}
          placeholder="Your answer…"
          value={value}
          onChange={(e) => set(e.target.value)}
        />
      );
    }
    if (f.field_type === "select") {
      return (
        <Select value={value} onValueChange={(v) => set(v as string)}>
          <SelectTrigger className="w-full">
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
        type={f.field_type === "date" ? "date" : f.field_type === "number" ? "number" : "text"}
        placeholder="Your answer…"
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
      } = await supabase.auth.getUser();
      const { data: staffRow } = await supabase
        .from("staff")
        .select("id")
        .eq("user_id", user?.id ?? "")
        .maybeSingle();

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
          created_by: staffRow?.id ?? null,
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

  if (!template || fields.length === 0) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  const isReview = step >= steps.length;

  return (
    <>
      <PageHeader
        title={template.name}
        description={`Client: ${clientName || "Unknown"} — generating a ${template.name} document.`}
      />

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>
            {isReview
              ? "Review your answers"
              : `Step ${step + 1} of ${steps.length}`}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isReview &&
            (steps[step] ?? []).map((f) => (
              <div key={f.id} className="space-y-1.5">
                <Label>
                  {f.label}
                  {f.required && <span className="text-destructive"> *</span>}
                </Label>
                {renderField(f)}
              </div>
            ))}

          {isReview && (
            <div className="space-y-2">
              {fields.map((f) => (
                <div
                  key={f.id}
                  className="flex items-start justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <span className="text-sm font-medium">{f.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {(answers[f.id] ?? "").trim() || "—"}
                  </span>
                </div>
              ))}
            </div>
          )}

          {stepError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {stepError}
            </p>
          )}
          {submitError && (
            <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {submitError}
            </p>
          )}

          <div className="flex justify-between">
            <Button variant="outline" onClick={back} disabled={step === 0}>
              Back
            </Button>
            {isReview ? (
              <Button onClick={handleSubmit} disabled={saving}>
                {saving ? "Generating…" : "Generate Document"}
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
