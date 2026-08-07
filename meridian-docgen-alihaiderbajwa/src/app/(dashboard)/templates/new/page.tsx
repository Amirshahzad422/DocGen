import { PageHeader } from "@/components/ui/page-header";
import { TemplateForm } from "@/components/templates/template-form";

export default function NewTemplatePage() {
  return (
    <>
      <PageHeader
        title="New Template"
        description="Define the document structure and its dynamic fields."
      />
      <TemplateForm mode="create" />
    </>
  );
}
