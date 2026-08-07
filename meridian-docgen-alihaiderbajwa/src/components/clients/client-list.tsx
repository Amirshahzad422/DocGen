"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";

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
  const [loading, setLoading] = useState(true);

  async function fetchClients(term?: string) {
    let q = supabase
      .from("clients")
      .select("id, name, email, phone, created_at, generated_documents(count)")
      .order("created_at", { ascending: false });
    if (term) {
      const like = `%${term}%`;
      q = q.or(`name.ilike.${like},email.ilike.${like}`);
    }
    const { data, error } = await q;
    return { data: (data ?? []) as ClientRow[], error };
  }

  useEffect(() => {
    let cancelled = false;
    fetchClients().then(({ data, error }) => {
      if (cancelled) return;
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setClients(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  function handleSearch(v: string) {
    setSearch(v);
    setLoading(true);
    fetchClients(v).then(({ data, error }) => {
      setLoading(false);
      if (error) {
        setError(error.message);
        return;
      }
      setClients(data);
    });
  }

  return (
    <div className="space-y-4">
      <Input
        placeholder="Search clients by name or email…"
        className="max-w-xs"
        value={search}
        onChange={(e) => handleSearch(e.target.value)}
      />

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : !clients || clients.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              No clients yet —{" "}
              <Link
                href="/clients/new"
                className="text-primary underline-offset-4 hover:underline"
              >
                create your first client
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Documents</TableHead>
              <TableHead>Created</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((c) => (
              <TableRow key={c.id} className="cursor-pointer">
                <TableCell>
                  <Link
                    href={`/clients/${c.id}`}
                    className="font-medium text-primary underline-offset-4 hover:underline"
                  >
                    {c.name}
                  </Link>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.email ?? "—"}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {c.phone ?? "—"}
                </TableCell>
                <TableCell>{c.generated_documents?.[0]?.count ?? 0}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(c.created_at).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
