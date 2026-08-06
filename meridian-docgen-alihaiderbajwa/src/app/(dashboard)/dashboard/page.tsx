import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase-server";
import ConnectivityCard from "@/components/dashboard/connectivity-card";

async function liveCounts() {
  const supabase = await createClient();
  const [{ count: templates }, { count: thisMonth }, { count: pending }] =
    await Promise.all([
      supabase
        .from("document_templates")
        .select("id", { count: "exact", head: true }),
      supabase
        .from("generated_documents")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString()),
      supabase
        .from("generated_documents")
        .select("id", { count: "exact", head: true })
        .in("status", ["draft", "under_review", "changes_requested"]),
    ]);
  return { templates, thisMonth, pending };
}

export default async function DashboardPage() {
  const counts = await liveCounts();

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Live totals, activity, and charts (built out in Phase 2)."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        <ConnectivityCard
          title="Total templates"
          value={counts.templates}
          note="from document_templates"
        />
        <ConnectivityCard
          title="Documents this month"
          value={counts.thisMonth}
          note="from generated_documents"
        />
        <ConnectivityCard
          title="Pending review"
          value={counts.pending}
          note="draft + under_review + changes_requested"
        />
      </div>
    </>
  );
}