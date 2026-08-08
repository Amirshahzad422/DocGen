"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldBuilder } from "@/components/templates/field-builder";
import { type TemplateFormState } from "@/lib/template-types";

const CATEGORIES = ["Estate Planning", "Corporate", "Real Estate", "Other"];

type Props = {
  mode: "create" | "edit";
  initial?: TemplateFormState | null; // null = empty (create)
  templateId?: string;
};

export function TemplateForm({ mode, initial, templateId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<TemplateFormState>(
    initial ?? { name: "", category: "Other", description: "", body: "", fields: [] },
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const messages: string[] = [];
    if (!form.name.trim()) messages.push("Name is required");
    if (!form.body.trim()) messages.push("Body is required");
    form.fields.forEach((f, i) => {
      if (!f.label.trim()) messages.push(`Field ${i + 1}: label is required`);
      if (f.field_type === "select" && f.options.filter((o) => o.trim()).length === 0)
        messages.push(`Field ${i + 1}: select fields need at least one option`);
    });
    if (messages.length > 0) {
      setError(messages.join(" · "));
      return;
    }

    setSaving(true);
    try {
      const rows = form.fields.map((f, i) => ({
        label: f.label.trim(),
        field_type: f.field_type,
        options:
          f.field_type === "select"
            ? f.options.map((o) => o.trim()).filter(Boolean)
            : [],
        required: f.required,
        sort_order: i,
      }));

      if (mode === "create") {
        const { data: tpl, error: tplErr } = await supabase
          .from("document_templates")
          .insert({
            name: form.name.trim(),
            category: form.category,
            description: form.description,
            body: form.body,
            status: "active",
          })
          .select("id")
          .single();

        if (tplErr) {
          let msg = tplErr.message;
          if (tplErr.code === "42501")
            msg += " (you may be signed in as a non-admin — use admin@meridian.demo)";
          setError(msg);
          return;
        }

        if (rows.length > 0) {
          const { error: fldErr } = await supabase
            .from("template_fields")
            .insert(rows.map((r) => ({ ...r, template_id: tpl.id })));
          if (fldErr) {
            // Avoid leaving an unusable template behind when its fields fail.
            await supabase.from("document_templates").delete().eq("id", tpl.id);
            setError(fldErr.message);
            return;
          }
        }
      } else {
        // Edit mode: "delete all + re-insert" instead of diffing. At this
        // scale (a handful of fields per template) it is far less bug-prone.
        const { error: updErr } = await supabase
          .from("document_templates")
          .update({
            name: form.name.trim(),
            category: form.category,
            description: form.description,
            body: form.body,
          })
          .eq("id", templateId);
        if (updErr) {
          setError(updErr.message);
          return;
        }

        const { error: delErr } = await supabase
          .from("template_fields")
          .delete()
          .eq("template_id", templateId);
        if (delErr) {
          setError(delErr.message);
          return;
        }

        if (rows.length > 0) {
          const { error: fldErr } = await supabase
            .from("template_fields")
            .insert(rows.map((r) => ({ ...r, template_id: templateId })));
          if (fldErr) {
            setError(fldErr.message);
            return;
          }
        }
      }

      router.push("/templates");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="e.g. Rental Agreement"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Category</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm({ ...form, category: v as string })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="Short description of this template"
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="body">Body</Label>
        <Textarea
          id="body"
          rows={14}
          placeholder="Document body…"
          value={form.body}
          onChange={(e) => setForm({ ...form, body: e.target.value })}
        />
        <p className="text-xs text-muted-foreground">
          Placeholder tokens: write {"{{field_label_slug}}"} exactly as the
          label below, slugified (lowercase, spaces → underscores). Example:
          label “Client Name” → token {"{{client_name}}"}.
        </p>
      </div>

      <div className="space-y-2">
        <Label>Fields</Label>
        <FieldBuilder
          fields={form.fields}
          onChange={(fields) => setForm({ ...form, fields })}
        />
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create Template"
              : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/templates")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
