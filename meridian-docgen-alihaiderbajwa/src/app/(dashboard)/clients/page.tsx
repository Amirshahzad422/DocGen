import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase-server";
import ConnectivityCard from "@/components/dashboard/connectivity-card";

async function counts() {
  const supabase = await createClient();
  const [{ count: clients }, { count: docs }] = await Promise.all([
    supabase.from("clients").select("id", { count: "exact", head: true }),
    supabase
      .from("generated_documents")
      .select("id", { count: "exact", head: true }),
  ]);
  return { clients, docs };
}

export default async function ClientsPage() {
  const c = await counts();

  return (
    <>
      <PageHeader
        title="Clients"
        description="Client records with document history (built out in Phase 3)."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ConnectivityCard title="Clients" value={c.clients} note="from clients" />
        <ConnectivityCard title="Linked documents" value={c.docs} note="from generated_documents" />
      </div>
    </>
  );
}