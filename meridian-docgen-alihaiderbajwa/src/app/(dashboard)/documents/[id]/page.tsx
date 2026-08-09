"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Send, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InlineError, Skeleton } from "@/components/ui/states";
import { canApprove } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type CommentRow = {
  id: string;
  comment: string;
  resolved: boolean;
  created_at: string;
  staff_id: { name: string } | null;
};

type DocumentDetail = {
  id: string;
  status: string;
  content: string;
  field_values: Record<string, string>;
  created_at: string;
  finalized_at: string | null;
  template_id: { id: string; name: string; category: string } | null;
  client_id: { id: string; name: string; email: string | null } | null;
  created_by: { name: string } | null;
  review_comments: CommentRow[];
};

type StaffMe = {
  id: string;
  name: string;
  role: string;
};

function initials(name: string | undefined | null): string {
  if (!name) return "?";
  return name.trim().slice(0, 1).toUpperCase();
}

export default function DocumentPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [doc, setDoc] = useState<DocumentDetail | null>(null);
  const [me, setMe] = useState<StaffMe | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      const { data: staff } = await supabase
        .from("staff")
        .select("id, name, roles(name)")
        .eq("user_id", user?.id ?? "")
        .maybeSingle();
      if (cancelled) return;
      setMe({
        id: staff?.id ?? "",
        name: staff?.name ?? "",
        role: (staff?.roles as unknown as { name?: string } | null)?.name ?? "",
      });

      const { data, error } = await supabase
        .from("generated_documents")
        .select(
          "id, status, content, field_values, created_at, finalized_at, template_id(*), client_id(*), created_by(name), review_comments(*, staff_id(name))",
        )
        .eq("id", params.id)
        .order("created_at", { foreignTable: "review_comments", ascending: false })
        .single();
      if (cancelled) return;
      if (error || !data) {
        setNotFound(true);
        return;
      }
      setDoc(data as unknown as DocumentDetail);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [params.id, reloadKey]);

  async function changeStatus(nextStatus: string, extra?: Record<string, string>) {
    setBusy(nextStatus);
    setActionError(null);
    if (nextStatus === "changes_requested" && doc && doc.review_comments.length === 0) {
      setActionError("Add at least one comment before requesting changes.");
      setBusy(null);
      return;
    }
    const patch: Record<string, unknown> = { status: nextStatus };
    if (nextStatus === "finalized") patch.finalized_at = new Date().toISOString();
    if (extra) Object.assign(patch, extra);
    const { error } = await supabase
      .from("generated_documents")
      .update(patch)
      .eq("id", params.id);
    setBusy(null);
    if (error) {
      setActionError(error.message);
      return;
    }
    setReloadKey((k) => k + 1);
    router.refresh();
  }

  async function addComment() {
    if (!commentText.trim() || !me?.id) return;
    setActionError(null);
    const { error } = await supabase.from("review_comments").insert({
      generated_document_id: params.id,
      staff_id: me.id,
      comment: commentText.trim(),
    });
    if (error) {
      setActionError(error.message);
      return;
    }
    setCommentText("");
    setReloadKey((k) => k + 1);
  }

  async function toggleResolved(comment: CommentRow) {
    const { error } = await supabase
      .from("review_comments")
      .update({ resolved: !comment.resolved })
      .eq("id", comment.id);
    if (error) {
      setActionError(error.message);
      return;
    }
    setReloadKey((k) => k + 1);
  }

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
    return (
      <div role="status" aria-label="Loading document" className="space-y-6">
        <div className="mb-2 border-b pb-5">
          <Skeleton className="mb-3 h-2.5 w-32" />
          <Skeleton className="h-8 w-72" />
          <Skeleton className="mt-3 h-3.5 w-full max-w-md" />
        </div>
        <Skeleton className="h-12 w-full max-w-xl rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-5">
          <Skeleton className="h-72 rounded-2xl lg:col-span-2" />
          <Skeleton className="h-96 rounded-2xl lg:col-span-3" />
        </div>
        <span className="sr-only">Loading…</span>
      </div>
    );
  }

  const isAttorney = canApprove(me?.role);

  const actions: { label: string; to: string; show: boolean }[] = [
    { label: "Start review", to: "under_review", show: isAttorney && doc.status === "draft" },
    { label: "Approve", to: "approved", show: isAttorney && doc.status === "under_review" },
    {
      label: "Finalize",
      to: "finalized",
      show: isAttorney && doc.status === "approved",
    },
    {
      label: "Request changes",
      to: "changes_requested",
      show: isAttorney && doc.status === "under_review",
    },
    {
      label: "Resubmit",
      to: "draft",
      show: doc.status === "changes_requested" && Boolean(me?.id),
    },
  ];

  return (
    <>
      <PageHeader
        title={doc.template_id?.name ?? "Document"}
        description={`Client: ${doc.client_id?.name ?? "Unknown"} · Created by: ${
          doc.created_by?.name ?? "—"
        } · ${new Date(doc.created_at).toLocaleString()}`}
        action={
          <Button variant="outline" onClick={() => router.push("/review")}>
            Back to review
          </Button>
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border bg-card/80 px-4 py-3.5 shadow-[0_18px_50px_-40px_color-mix(in_oklch,var(--foreground)_38%,transparent)]">
        <StatusBadge status={doc.status} />
        {doc.finalized_at && (
          <span className="text-xs text-muted-foreground">
            Finalized {new Date(doc.finalized_at).toLocaleString()}
          </span>
        )}
        {actions.some((a) => a.show) && (
          <div className="flex flex-wrap gap-2 sm:ml-auto">
            {actions
              .filter((a) => a.show)
              .map((a) => (
                <Button
                  key={a.to}
                  size="sm"
                  variant={a.to === "approved" || a.to === "finalized" ? "default" : "outline"}
                  disabled={busy !== null}
                  onClick={() => changeStatus(a.to)}
                >
                  {busy === a.to ? "Working…" : a.label}
                </Button>
              ))}
          </div>
        )}
      </div>

      {actionError && <div className="mb-6"><InlineError message={actionError} /></div>}

      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Field answers</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {Object.entries(doc.field_values ?? {}).map(([label, value]) => (
              <div
                key={label}
                className="flex items-start justify-between gap-3 rounded-xl border bg-muted/[0.18] px-3.5 py-2.5"
              >
                <span className="text-sm font-medium">{label}</span>
                <span className="max-w-[55%] break-words text-right text-sm text-muted-foreground">{value || "—"}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 overflow-hidden">
          <CardHeader>
            <CardTitle>Draft</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-2xl border bg-[#faf8f2] p-6 shadow-inner dark:bg-slate-900/60">
              <pre className="max-h-96 overflow-y-auto whitespace-pre-wrap font-serif text-[0.9rem] leading-7 text-slate-800 dark:text-slate-200">
                {doc.content}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Comments ({doc.review_comments?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {(doc.review_comments ?? []).length === 0 ? (
            <p className="text-sm text-muted-foreground">No comments yet.</p>
          ) : (
            <ul className="space-y-2">
              {(doc.review_comments ?? []).map((c) => (
                <li
                  key={c.id}
                  className="flex items-start gap-3 rounded-xl border bg-muted/[0.18] px-3.5 py-3"
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary ring-1 ring-primary/10">
                    {initials(c.staff_id?.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm">
                      <span className="font-medium">{c.staff_id?.name ?? "Unknown"}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleString()}
                      </span>
                    </p>
                    <p
                      className={cn("mt-0.5 text-sm", c.resolved && "text-muted-foreground line-through")}
                    >
                      {c.comment}
                    </p>
                  </div>
                  {isAttorney && (
                    <Button
                      variant={c.resolved ? "default" : "outline"}
                      size="sm"
                      className="shrink-0"
                      onClick={() => toggleResolved(c)}
                    >
                      {c.resolved ? "Resolved" : "Resolve"}
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}

          <div className="space-y-2 border-t pt-4">
            <Label htmlFor="comment">Add a comment</Label>
            <div className="flex gap-2">
              <Input
                id="comment"
                placeholder="Comment on this draft…"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") addComment();
                }}
              />
              <Button type="button" size="icon" onClick={addComment} disabled={!commentText.trim()} aria-label="Send comment">
                <Send aria-hidden="true" />
              </Button>
            </div>
            {isAttorney && (
              <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldCheck className="size-3.5" aria-hidden="true" /> Attorneys can resolve comments once addressed.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
