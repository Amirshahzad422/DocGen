"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export type ClientFormData = {
  name: string;
  email: string;
  phone: string;
  address: string;
  notes: string;
};

type Props = {
  mode: "create" | "edit";
  initial?: ClientFormData | null;
  clientId?: string;
};

export function ClientForm({ mode, initial, clientId }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ClientFormData>(
    initial ?? { name: "", email: "", phone: "", address: "", notes: "" },
  );
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof ClientFormData>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        email: form.email.trim() || null,
        phone: form.phone.trim() || null,
        address: form.address.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (mode === "create") {
        const { data: client, error: insErr } = await supabase
          .from("clients")
          .insert(payload)
          .select("id")
          .single();
        if (insErr) {
          setError(insErr.message);
          return;
        }
        router.push(`/clients/${client.id}`);
        router.refresh();
      } else {
        const { error: updErr } = await supabase
          .from("clients")
          .update(payload)
          .eq("id", clientId);
        if (updErr) {
          setError(updErr.message);
          return;
        }
        router.push(`/clients/${clientId}`);
        router.refresh();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            placeholder="e.g. John Smith"
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="client@example.com"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            placeholder="+92 300 000 0000"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            placeholder="Street, City"
            value={form.address}
            onChange={(e) => set("address", e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          rows={4}
          placeholder="Internal notes about this client…"
          value={form.notes}
          onChange={(e) => set("notes", e.target.value)}
        />
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button type="submit" disabled={saving}>
          {saving
            ? mode === "create"
              ? "Creating…"
              : "Saving…"
            : mode === "create"
              ? "Create Client"
              : "Save Changes"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/clients")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
