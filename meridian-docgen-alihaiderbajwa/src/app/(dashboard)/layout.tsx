import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase-server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: staff } = await supabase
    .from("staff")
    .select("name, email")
    .eq("user_id", user.id)
    .single();

  return (
    <DashboardShell
      userName={staff?.name ?? user.email}
      userEmail={user.email}
    >
      {children}
    </DashboardShell>
  );
}
