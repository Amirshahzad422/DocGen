import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TemplateList } from "@/components/templates/template-list";

export default function TemplatesPage() {
  return (
    <>
      <PageHeader
        title="Template Library"
        description="Create, edit, and organize document templates."
        action={
          <Link
            href="/templates/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            New Template
          </Link>
        }
      />
      <TemplateList />
    </>
  );
}
