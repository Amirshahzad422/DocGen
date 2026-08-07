"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FIELD_TYPES, type FieldType, type TemplateFieldDraft } from "@/lib/template-types";

export function FieldBuilder({
  fields,
  onChange,
  mode,
}: {
  fields: TemplateFieldDraft[];
  onChange: (fields: TemplateFieldDraft[]) => void;
  mode?: "create" | "edit";
}) {
  function update(i: number, patch: Partial<TemplateFieldDraft>) {
    onChange(fields.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));
  }

  function remove(i: number) {
    onChange(fields.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= fields.length) return;
    const next = [...fields];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  }

  function addField() {
    onChange([
      ...fields,
      {
        id: mode === "edit" ? `__new__${fields.length}` : crypto.randomUUID(),
        label: "",
        field_type: "text",
        options: [],
        required: false,
      },
    ]);
  }

  return (
    <div className="space-y-3">
      {fields.map((f, i) => (
        <div key={f.id} className="space-y-2 rounded-lg border p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>Label</Label>
              <Input
                placeholder="e.g. Client Name"
                value={f.label}
                onChange={(e) => update(i, { label: e.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select
                value={f.field_type}
                onValueChange={(v) => update(i, { field_type: v as FieldType })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FIELD_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {f.field_type === "select" && (
            <div className="space-y-1.5">
              <Label>Options (comma-separated)</Label>
              <Input
                placeholder="Option 1, Option 2, Option 3"
                value={f.options.join(", ")}
                onChange={(e) =>
                  update(i, { options: e.target.value.split(",") })
                }
              />
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={f.required}
                onChange={(e) => update(i, { required: e.target.checked })}
              />
              Required
            </label>
            <div className="flex items-center gap-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => move(i, -1)} disabled={i === 0}>
                ↑
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => move(i, 1)}
                disabled={i === fields.length - 1}
              >
                ↓
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => remove(i)}>
                Remove
              </Button>
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addField}>
        + Add field
      </Button>
    </div>
  );
}
