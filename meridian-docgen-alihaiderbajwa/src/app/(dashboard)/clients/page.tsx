import { PageHeader } from "@/components/ui/page-header";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ClientList } from "@/components/clients/client-list";

export default function ClientsPage() {
  return (
    <>
      <PageHeader
        title="Clients"
        description="Client records with document history."
        action={
          <Link
            href="/clients/new"
            className={cn(buttonVariants({ variant: "default" }))}
          >
            New Client
          </Link>
        }
      />
      <ClientList />
    </>
  );
}
