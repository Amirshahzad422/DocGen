"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

type DocumentDetail = {
  id: string;
  status: string;
  content: string;
  created_at: string;
  template_id: { name: string } | null;
  client_id: { name: string } | null;
};

export default function DocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("generated_documents")
      .select("id, status, content, created_at, template_id(name), client_id(name)")
      .eq("id", params.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setNotFound(true);
          return;
        }
        setDoc(data as unknown as DocumentDetail);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (notFound) {
    return (
      <>
        <PageHeader title="Document not found" />
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              This document may have been deleted.
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  if (!doc) {
    return <p className="text-sm text-muted-foreground">Loading…</p>;
  }

  return (
    <>
      <PageHeader
        title={doc.template_id?.name ?? "Document"}
        description={`Client: ${doc.client_id?.name ?? "Unknown"} · Generated ${new Date(
          doc.created_at,
        ).toLocaleString()}`}
        action={
          <Button variant="outline" onClick={() => router.push("/wizard")}>
            Generate another
          </Button>
        }
      />

      <div className="mb-4">
        <Badge>{doc.status}</Badge>
      </div>

      <Card>
        <CardContent className="pt-6">
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">
            {doc.content}
          </pre>
        </CardContent>
      </Card>
    </>
  );
}
