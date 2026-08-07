export const FIELD_TYPES = ["text", "textarea", "date", "select", "number"] as const;
export type FieldType = (typeof FIELD_TYPES)[number];

export type TemplateFieldDraft = {
  id: string; // client-side key (crypto.randomUUID())
  label: string;
  field_type: FieldType;
  options: string[]; // used when field_type === "select"
  required: boolean;
};

export type TemplateFormState = {
  name: string;
  category: string;
  description: string;
  body: string;
  fields: TemplateFieldDraft[];
};
