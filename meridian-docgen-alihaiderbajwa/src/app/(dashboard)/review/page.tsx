import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase-server";
import ConnectivityCard from "@/components/dashboard/connectivity-card";

async function counts() {
  const supabase = await createClient();
  const { count } = await supabase
    .from("generated_documents")
    .select("id", { count: "exact", head: true })
    .in("status", ["draft", "under_review", "changes_requested"]);
  return { pending: count };
}

export default async function ReviewPage() {
  const c = await counts();

  return (
    <>
      <PageHeader
        title="Review Queue"
        description="Drafts awaiting attorney review (built out in Phase 4)."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ConnectivityCard title="Pending review" value={c.pending} note="drafts in the queue" />
      </div>
    </>
  );
}