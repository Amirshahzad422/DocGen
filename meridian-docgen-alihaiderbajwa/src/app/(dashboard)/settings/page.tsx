import { PageHeader } from "@/components/ui/page-header";
import { createClient } from "@/lib/supabase-server";
import { Card, CardContent } from "@/components/ui/card";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: firm } = await supabase
    .from("firm_settings")
    .select("firm_name, tagline, address, phone, email")
    .eq("id", 1)
    .single();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Firm information, roles, and your profile (Phase 5)."
      />
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm font-medium">{firm?.firm_name ?? "Firm name not set"}</p>
          <p className="text-sm text-muted-foreground">{firm?.tagline ?? ""}</p>
          <p className="mt-2 text-xs text-muted-foreground">{firm?.address}</p>
          <p className="text-xs text-muted-foreground">{firm?.phone}</p>
          <p className="text-xs text-muted-foreground">{firm?.email}</p>
        </CardContent>
      </Card>
    </>
  );
}