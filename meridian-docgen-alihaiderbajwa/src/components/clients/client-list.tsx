"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Mail, Phone, UserRoundPlus, UsersRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { buttonVariants } from "@/components/ui/button";
import { SearchInput } from "@/components/ui/search-input";
import { EmptyState, InlineError, TableSkeleton } from "@/components/ui/states";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

type ClientRow = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  created_at: string;
  generated_documents: { count: number }[];
};

export function ClientList() {
  const [clients, setClients] = useState<ClientRow[] | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const debouncedSearch = useDebouncedValue(search);

  useEffect(() => {
    let cancelled = false;
    let query = supabase
      .from("clients")
      .select("id, name, email, phone, created_at, generated_documents(count)")
      .order("created_at", { ascending: false })
    const term = debouncedSearch.trim();
    if (term) {
      const escaped = term.replace(/[(),]/g, " ");
      query = query.or(`name.ilike.%${escaped}%,email.ilike.%${escaped}%,phone.ilike.%${escaped}%`);
    }
    query.then(({ data, error }) => {
        if (cancelled) return;
        if (error) setError(error.message);
        else {
          setError(null);
          setClients((data ?? []) as ClientRow[]);
        }
        setSearching(false);
      });
    return () => {
      cancelled = true;
    };
  }, [debouncedSearch]);

  const visibleClients = clients ?? [];

  return (
    <div className="space-y-4">
      <SearchInput
        placeholder="Search clients by name, email, or phone…"
        value={search}
        aria-busy={searching}
        onChange={(event) => {
          setSearch(event.target.value);
          setSearching(true);
        }}
      />

      {error && <InlineError message={error} />}

      {clients === null && !error ? (
        <TableSkeleton />
      ) : visibleClients.length === 0 ? (
        <EmptyState
          icon={search ? UsersRound : UserRoundPlus}
          title={search ? "No matching clients" : "No clients yet"}
          description={search ? "Try a different name, email address, or phone number." : "Add the first client record to begin generating documents."}
          action={!search ? (
            <Link href="/clients/new" className={cn(buttonVariants())}>
              <UserRoundPlus aria-hidden="true" /> New client
            </Link>
          ) : undefined}
        />
      ) : (
        <>
          <div className="grid gap-3 md:hidden">
            {visibleClients.map((client) => (
              <Link key={client.id} href={`/clients/${client.id}`} className="rounded-2xl border bg-card p-4 shadow-sm transition-colors hover:border-primary/20 hover:bg-primary/[0.02]">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-heading text-sm font-semibold">{client.name}</p>
                    <p className="mt-1 text-xs text-muted-foreground">Added {new Date(client.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/[0.08] px-2 py-1 text-xs font-medium text-primary">
                    <FileText className="size-3" aria-hidden="true" />
                    {client.generated_documents?.[0]?.count ?? 0}
                  </span>
                </div>
                <div className="mt-4 space-y-2 border-t pt-3 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2"><Mail className="size-3.5" aria-hidden="true" />{client.email ?? "No email"}</p>
                  <p className="flex items-center gap-2"><Phone className="size-3.5" aria-hidden="true" />{client.phone ?? "No phone"}</p>
                </div>
              </Link>
            ))}
          </div>
          <div className="hidden overflow-hidden rounded-2xl border bg-card shadow-sm md:block">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Phone</TableHead><TableHead>Documents</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
              <TableBody>
                {visibleClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell><Link href={`/clients/${client.id}`} className="font-medium text-primary underline-offset-4 hover:underline">{client.name}</Link></TableCell>
                    <TableCell className="text-muted-foreground">{client.email ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground">{client.phone ?? "—"}</TableCell>
                    <TableCell>{client.generated_documents?.[0]?.count ?? 0}</TableCell>
                    <TableCell className="text-muted-foreground">{new Date(client.created_at).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
