"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/page-header";
import { ClientForm, type ClientFormData } from "@/components/clients/client-form";
import { Card, CardContent } from "@/components/ui/card";
import { FormSkeleton } from "@/components/ui/states";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function EditClientPage() {
  const params = useParams<{ id: string }>();
  const [initial, setInitial] = useState<ClientFormData | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("clients")
      .select("id, name, email, phone, address, notes")
      .eq("id", params.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setNotFound(true);
          return;
        }
        setInitial({
          name: data.name,
          email: data.email ?? "",
          phone: data.phone ?? "",
          address: data.address ?? "",
          notes: data.notes ?? "",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (notFound) {
    return (
      <>
        <PageHeader title="Client not found" />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              This client may have been deleted.{" "}
              <Link
                href="/clients"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Back to clients
              </Link>
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!initial) {
    return (
      <>
        <PageHeader title="Edit client" description="Update this client's contact details." />
        <FormSkeleton />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={`Edit ${initial.name}`}
        description="Update this client's contact details."
      />
      <ClientForm mode="edit" initial={initial} clientId={params.id} />
    </>
  );
}
