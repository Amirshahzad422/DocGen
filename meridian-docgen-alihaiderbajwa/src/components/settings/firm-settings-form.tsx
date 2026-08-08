"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type FirmSettings = {
  id: number;
  firm_name: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  logo_url: string;
};

type RoleRow = { id: string; name: string; description: string | null };

type ProfileRow = {
  id: string;
  name: string;
  email: string;
  roles: { name: string } | null;
  auth_email: string;
};

export function FirmSettingsForm() {
  const [tab, setTab] = useState<"firm" | "roles" | "profile">("firm");

  const [firm, setFirm] = useState<FirmSettings | null>(null);
  const [savingFirm, setSavingFirm] = useState(false);

  const [roles, setRoles] = useState<RoleRow[] | null>(null);

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [profileName, setProfileName] = useState("");
  const [profileEmail, setProfileEmail] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const [
        { data: firmData, error: fErr },
        { data: roleData, error: rErr },
        {
          data: { user },
        },
      ] = await Promise.all([
        supabase.from("firm_settings").select("*").eq("id", 1).maybeSingle(),
        supabase.from("roles").select("id, name, description").order("name"),
        supabase.auth.getUser(),
      ]);
      if (cancelled) return;
      if (fErr) {
        setError(fErr.message);
        return;
      }
      if (rErr) {
        setError(rErr.message);
        return;
      }
      setFirm((firmData as unknown as FirmSettings | null) ?? null);
      setRoles((roleData ?? []) as RoleRow[]);

      if (user?.id) {
        const { data: me } = await supabase
          .from("staff")
          .select("id, name, email, roles(name)")
          .eq("user_id", user.id)
          .maybeSingle();
        if (cancelled) return;
        if (me) {
          setProfile({
            id: me.id,
            name: me.name,
            email: me.email,
            roles: (me.roles as unknown as { name: string } | null) ?? null,
            auth_email: user.email ?? "",
          });
          setProfileName(me.name);
          setProfileEmail(me.email);
        }
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function saveFirm() {
    if (!firm) return;
    setSavingFirm(true);
    setError(null);
    setSaved(null);
    const { error: err } = await supabase
      .from("firm_settings")
      .update({
        firm_name: firm.firm_name,
        tagline: firm.tagline,
        address: firm.address,
        phone: firm.phone,
        email: firm.email,
        logo_url: firm.logo_url,
      })
      .eq("id", 1);
    setSavingFirm(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSaved("Firm settings saved.");
  }

  async function saveProfile() {
    if (!profile) return;
    setSavingProfile(true);
    setError(null);
    setSaved(null);
    const { error: err } = await supabase
      .from("staff")
      .update({ name: profileName.trim() || profile.name, email: profileEmail.trim() || profile.email })
      .eq("id", profile.id);
    setSavingProfile(false);
    if (err) {
      setError(err.message);
      return;
    }
    setSaved("Profile saved.");
  }

  const tabClass = (t: string) =>
    `rounded-md px-3 py-1.5 text-sm font-medium ${
      tab === t
        ? "bg-primary text-primary-foreground"
        : "text-muted-foreground hover:bg-muted"
    }`;

  return (
    <div className="space-y-6">
      <div className="flex gap-1 rounded-lg border bg-card p-1">
        <button className={tabClass("firm")} onClick={() => setTab("firm")}>
          Firm info
        </button>
        <button className={tabClass("roles")} onClick={() => setTab("roles")}>
          Roles
        </button>
        <button className={tabClass("profile")} onClick={() => setTab("profile")}>
          Profile
        </button>
      </div>

      {error && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}
      {saved && (
        <p className="rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600">
          {saved}
        </p>
      )}

      {tab === "firm" && (
        <Card>
          <CardHeader>
            <CardTitle>Firm information</CardTitle>
          </CardHeader>
          <CardContent>
            {firm === null ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Firm name</Label>
                  <Input
                    value={firm.firm_name}
                    onChange={(e) => setFirm({ ...firm, firm_name: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Tagline</Label>
                  <Input
                    value={firm.tagline}
                    onChange={(e) => setFirm({ ...firm, tagline: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Address</Label>
                  <Textarea
                    value={firm.address}
                    onChange={(e) => setFirm({ ...firm, address: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Phone</Label>
                  <Input
                    value={firm.phone}
                    onChange={(e) => setFirm({ ...firm, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={firm.email}
                    onChange={(e) => setFirm({ ...firm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Logo URL</Label>
                  <Input
                    value={firm.logo_url}
                    onChange={(e) => setFirm({ ...firm, logo_url: e.target.value })}
                    placeholder="https://…"
                  />
                </div>
                <div className="sm:col-span-2">
                  <Button onClick={saveFirm} disabled={savingFirm}>
                    {savingFirm ? "Saving…" : "Save firm settings"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "roles" && (
        <Card>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              New roles are added via SQL (supabase/sql/seed.sql) so the RLS
              policies stay predictable.
            </p>
            {roles === null ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <ul className="space-y-2">
                {roles.map((r) => (
                  <li key={r.id} className="rounded-md border px-3 py-2">
                    <span className="text-sm font-medium">{r.name}</span>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "profile" && (
        <Card>
          <CardHeader>
            <CardTitle>Your profile</CardTitle>
          </CardHeader>
          <CardContent>
            {profile === null ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Name</Label>
                  <Input
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label>Email</Label>
                  <Input value={profileEmail} onChange={(e) => setProfileEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <Label>Role</Label>
                  <p className="text-sm font-medium">{profile.roles?.name ?? "—"}</p>
                </div>
                <div className="space-y-1.5">
                  <Label>Auth email (read-only)</Label>
                  <p className="text-sm text-muted-foreground">{profile.auth_email}</p>
                </div>
                <div className="sm:col-span-2">
                  <Button onClick={saveProfile} disabled={savingProfile}>
                    {savingProfile ? "Saving…" : "Save profile"}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
