"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/page-header";
import { TemplateForm } from "@/components/templates/template-form";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FormSkeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";
import {
  type TemplateFieldDraft,
  type TemplateFormState,
  type FieldType,
} from "@/lib/template-types";

type LoadedTemplate = {
  name: string;
  category: string;
  description: string | null;
  body: string;
  template_fields: {
    id: string;
    label: string;
    field_type: string;
    options: string[] | null;
    required: boolean;
    sort_order: number;
  }[];
};

export default function EditTemplatePage() {
  const params = useParams<{ id: string }>();
  const [initial, setInitial] = useState<TemplateFormState | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("document_templates")
      .select(
        "id, name, category, description, body, status, template_fields(id, label, field_type, options, required, sort_order)",
      )
      .eq("id", params.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setNotFound(true);
          return;
        }
        const tpl = data as unknown as LoadedTemplate;
        const fields: TemplateFieldDraft[] = [...tpl.template_fields]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((f) => ({
            id: f.id,
            label: f.label,
            field_type: f.field_type as FieldType,
            options: f.options ?? [],
            required: f.required,
          }));
        setInitial({
          name: tpl.name,
          category: tpl.category,
          description: tpl.description ?? "",
          body: tpl.body,
          fields,
        });
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (notFound) {
    return (
      <>
        <PageHeader title="Template not found" />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              This template may have been deleted.{" "}
              <Link
                href="/templates"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Back to templates
              </Link>
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!initial) {
    return (
      <>
        <PageHeader title="Edit template" description="Update the template structure and its dynamic fields." />
        <FormSkeleton rows={2} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Edit ${initial.name}`}
        description="Update the template structure and its dynamic fields."
      />
      <TemplateForm mode="edit" initial={initial} templateId={params.id} />
    </>
  );
}
