import { PageHeader } from "@/components/ui/page-header";
import { FirmSettingsForm } from "@/components/settings/firm-settings-form";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        description="Firm information, roles, and your profile."
      />
      <FirmSettingsForm />
    </>
  );
}
