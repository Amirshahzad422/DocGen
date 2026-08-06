import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase-server";
import ConnectivityCard from "@/components/dashboard/connectivity-card";

async function counts() {
  const supabase = await createClient();
  const [{ count: total }, { count: finalized }] = await Promise.all([
    supabase
      .from("generated_documents")
      .select("id", { count: "exact", head: true }),
    supabase
      .from("generated_documents")
      .select("id", { count: "exact", head: true })
      .eq("status", "finalized"),
  ]);
  return { total, finalized };
}

export default async function ReportsPage() {
  const c = await counts();

  return (
    <>
      <PageHeader
        title="Reports"
        description="Live aggregates: per-month, top templates, review times (Phase 5)."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ConnectivityCard title="Documents total" value={c.total} note="from generated_documents" />
        <ConnectivityCard title="Finalized" value={c.finalized} note="approved and closed" />
      </div>
    </>
  );
}