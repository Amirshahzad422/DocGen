import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase-server";
import ConnectivityCard from "@/components/dashboard/connectivity-card";

async function counts() {
  const supabase = await createClient();
  const [{ count: staff }, { count: roles }] = await Promise.all([
    supabase.from("staff").select("id", { count: "exact", head: true }),
    supabase.from("roles").select("id", { count: "exact", head: true }),
  ]);
  return { staff, roles };
}

export default async function StaffPage() {
  const c = await counts();

  return (
    <>
      <PageHeader
        title="Staff"
        description="Users, roles, and permissions (built out in Phase 4)."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <ConnectivityCard title="Staff members" value={c.staff} note="from staff" />
        <ConnectivityCard title="Roles" value={c.roles} note="from roles" />
      </div>
    </>
  );
}