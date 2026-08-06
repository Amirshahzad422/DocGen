import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase-server";
import ConnectivityCard from "@/components/dashboard/connectivity-card";

async function counts() {
  const supabase = await createClient();
  const [{ count: templates }, { count: clients }] = await Promise.all([
    supabase
      .from("document_templates")
      .select("id", { count: "exact", head: true })
      .eq("status", "active"),
    supabase.from("clients").select("id", { count: "exact", head: true }),
  ]);
  return { templates, clients };
}

export default async function WizardPage() {
  const c = await counts();

  return (
    <>
      <PageHeader
        title="Wizard"
        description="Multi-step document wizard (built out in Phase 3)."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ConnectivityCard title="Active templates" value={c.templates} note="ready to fill" />
        <ConnectivityCard title="Clients" value={c.clients} note="pick a client" />
      </div>
    </>
  );
}