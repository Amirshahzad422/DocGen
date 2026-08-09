"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type StaffRow = {
  id: string;
  name: string;
  email: string;
  role_id: { name: string } | null;
  active: boolean;
  created_at: string;
};

export function StaffList() {
  const [staff, setStaff] = useState<StaffRow[] | null>(null);
  const [roles, setRoles] = useState<{ id: string; name: string; description: string | null }[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  async function load() {
    const [sRes, rRes] = await Promise.all([
      supabase
        .from("staff")
        .select("*, role_id(name)")
        .order("created_at", { ascending: false }),
      supabase.from("roles").select("id, name, description").order("name"),
    ]);
    if (sRes.error) {
      setError(sRes.error.message);
      return;
    }
    if (rRes.error) {
      setError(rRes.error.message);
      return;
    }
    setError(null);
    setStaff((sRes.data ?? []) as unknown as StaffRow[]);
    setRoles((rRes.data ?? []) as { id: string; name: string; description: string | null }[]);
  }

  useEffect(() => {
    (async () => {
      const [sRes, rRes] = await Promise.all([
        supabase
          .from("staff")
          .select("*, role_id(name)")
          .order("created_at", { ascending: false }),
        supabase.from("roles").select("id, name, description").order("name"),
      ]);
      if (sRes.error) setError(sRes.error.message);
      else if (rRes.error) setError(rRes.error.message);
      else {
        setStaff((sRes.data ?? []) as unknown as StaffRow[]);
        setRoles((rRes.data ?? []) as { id: string; name: string; description: string | null }[]);
      }
    })();
    return () => {};
  }, []);

  async function createStaff() {
    if (!name.trim() || !email.trim() || !roleId) {
      setError("Name, email and role are required");
      return;
    }
    setError(null);
    setCreating(true);
    const { error } = await supabase.from("staff").insert({
      name: name.trim(),
      email: email.trim(),
      role_id: roleId,
      active: true,
    });
    setCreating(false);
    if (error) {
      setError(error.message);
      return;
    }
    setName("");
    setEmail("");
    setRoleId(null);
    load();
  }

  async function toggleActive(row: StaffRow) {
    const { error } = await supabase
      .from("staff")
      .update({ active: !row.active })
      .eq("id", row.id);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  async function changeRole(row: StaffRow, newRoleId: string) {
    const { error } = await supabase
      .from("staff")
      .update({ role_id: newRoleId })
      .eq("id", row.id);
    if (error) {
      setError(error.message);
      return;
    }
    load();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Add staff member</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-4">
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                placeholder="Full name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Email</Label>
              <Input
                type="email"
                placeholder="name@firm.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select
                value={roleId ?? ""}
                onValueChange={(v) => setRoleId(v as string)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select role…" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button onClick={createStaff} disabled={creating}>
                {creating ? "Adding…" : "Add staff"}
              </Button>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            New staff access must be activated by an administrator before they can sign in.
          </p>
        </CardContent>
      </Card>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Staff directory</CardTitle>
        </CardHeader>
        <CardContent>
          {staff === null ? (
            <p className="text-sm text-muted-foreground">Loading…</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell className="text-muted-foreground">{s.email}</TableCell>
                    <TableCell>
                      <Select
                        value={s.role_id?.name ?? ""}
                        onValueChange={(v) => {
                          const role = roles.find((r) => r.name === v);
                          if (role) changeRole(s, role.id);
                        }}
                      >
                        <SelectTrigger size="sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.name}>
                              {r.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge variant={s.active ? "default" : "secondary"}>
                        {s.active ? "active" : "inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleActive(s)}
                      >
                        {s.active ? "Deactivate" : "Activate"}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Roles</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-3 text-sm text-muted-foreground">
            Roles determine which workspace actions each staff member can perform.
          </p>
          <ul className="space-y-2">
            {roles.map((r) => (
              <li key={r.id} className="rounded-md border px-3 py-2">
                <span className="text-sm font-medium">{r.name}</span>
                <p className="text-xs text-muted-foreground">{r.description}</p>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
