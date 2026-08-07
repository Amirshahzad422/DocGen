import { PageHeader } from "@/components/ui/page-header";
import { ClientForm } from "@/components/clients/client-form";

export default function NewClientPage() {
  return (
    <>
      <PageHeader
        title="New Client"
        description="Add a client to the firm directory."
      />
      <ClientForm mode="create" />
    </>
  );
}
