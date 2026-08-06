import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase-server";
import ConnectivityCard from "@/components/dashboard/connectivity-card";

async function counts() {
  const supabase = await createClient();
  const [{ count: templates }, { count: fields }] = await Promise.all([
    supabase
      .from("document_templates")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("template_fields")
      .select("id", { count: "exact", head: true }),
  ]);
  return { templates, fields };
}

export default async function TemplatesPage() {
  const c = await counts();

  return (
    <>
      <PageHeader
        title="Templates"
        description="Template library with dynamic fields (built out in Phase 2)."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ConnectivityCard title="Templates" value={c.templates} note="from document_templates" />
        <ConnectivityCard title="Dynamic fields" value={c.fields} note="from template_fields" />
      </div>
    </>
  );
}