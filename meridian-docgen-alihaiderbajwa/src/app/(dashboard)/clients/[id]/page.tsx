"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/page-header";
import { buttonVariants } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/states";
import { cn } from "@/lib/utils";

type ClientDetail = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  created_at: string;
};

type DocRow = {
  id: string;
  status: string;
  created_at: string;
  template_id: { name: string } | null;
};

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [docs, setDocs] = useState<DocRow[] | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const { data: clientData, error: cErr } = await supabase
        .from("clients")
        .select("id, name, email, phone, address, notes, created_at")
        .eq("id", params.id)
        .single();
      if (cancelled) return;
      if (cErr || !clientData) {
        setNotFound(true);
        return;
      }
      setClient(clientData as ClientDetail);

      const { data: docData, error: dErr } = await supabase
        .from("generated_documents")
        .select("id, status, created_at, template_id(name)")
        .eq("client_id", params.id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      if (!dErr) setDocs((docData ?? []) as unknown as DocRow[]);
    }
    load();
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

  if (!client) {
    return (
      <div role="status" aria-label="Loading client" className="space-y-6">
        <div className="mb-2 border-b pb-5">
          <Skeleton className="mb-3 h-2.5 w-32" />
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-3 h-3.5 w-full max-w-md" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-56 rounded-2xl lg:col-span-1" />
          <Skeleton className="h-56 rounded-2xl lg:col-span-2" />
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title={client.name}
        description="Client profile and document history."
        action={
          <Link
            href={`/clients/${client.id}/edit`}
            className={cn(buttonVariants({ variant: "outline" }))}
          >
            Edit
          </Link>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <span className="text-muted-foreground">Email: </span>
              {client.email ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Phone: </span>
              {client.phone ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Address: </span>
              {client.address ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Notes: </span>
              {client.notes ?? "—"}
            </p>
            <p>
              <span className="text-muted-foreground">Client since: </span>
              {new Date(client.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
            {docs === null ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton key={index} className="h-11 w-full rounded-lg" />
                ))}
              </div>
            ) : docs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No documents yet — generate one via the{" "}
                <Link
                  href="/wizard"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  Wizard
                </Link>
                .
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Template</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">View</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {docs.map((d) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">
                        {d.template_id?.name ?? "Unknown template"}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={d.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(d.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          href={`/documents/${d.id}`}
                          className={cn(
                            buttonVariants({ variant: "outline", size: "sm" }),
                          )}
                        >
                          View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
