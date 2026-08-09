"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Landmark, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormSkeleton, InlineError } from "@/components/ui/states";
import { cn } from "@/lib/utils";

const CARD_SHADOW = "shadow-[0_18px_50px_-34px_color-mix(in_oklch,var(--foreground)_38%,transparent)]";

const TABS = [
  { key: "firm" as const, label: "Firm info", icon: Landmark },
  { key: "roles" as const, label: "Roles", icon: ShieldCheck },
  { key: "profile" as const, label: "Profile", icon: UserRound },
];

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
      const firmRow = firmData as unknown as FirmSettings | null;
      setFirm(
        firmRow && {
          ...firmRow,
          tagline: firmRow.tagline ?? "",
          address: firmRow.address ?? "",
          phone: firmRow.phone ?? "",
          email: firmRow.email ?? "",
          logo_url: firmRow.logo_url ?? "",
        },
      );
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

  return (
    <div className="space-y-6">
      <div className="inline-flex gap-1 rounded-xl border bg-card p-1 shadow-sm">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              tab === key
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      {error && <InlineError message={error} />}
      {saved && (
        <div role="status" className="flex items-center gap-2.5 rounded-xl border border-emerald-500/15 bg-emerald-500/[0.07] px-3.5 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          <CheckCircle2 className="size-4 shrink-0" aria-hidden="true" />
          <p>{saved}</p>
        </div>
      )}

      {tab === "firm" && (
        <Card className={CARD_SHADOW}>
          <CardHeader>
            <CardTitle>Firm information</CardTitle>
          </CardHeader>
          <CardContent>
            {firm === null ? (
              <FormSkeleton rows={4} />
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
        <Card className={CARD_SHADOW}>
          <CardHeader>
            <CardTitle>Roles</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Roles define the workspace access available to each member of staff.
              New roles are added via SQL (supabase/sql/seed.sql) so the RLS
              policies stay predictable.
            </p>
            {roles === null ? (
              <div className="grid gap-2 sm:grid-cols-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={index} className="h-14 animate-pulse rounded-xl bg-muted" />
                ))}
              </div>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-3">
                {roles.map((r) => (
                  <li key={r.id} className="rounded-xl border bg-muted/[0.18] px-3.5 py-2.5">
                    <span className="text-sm font-medium capitalize">{r.name}</span>
                    <p className="mt-0.5 text-xs text-muted-foreground">{r.description}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      )}

      {tab === "profile" && (
        <Card className={CARD_SHADOW}>
          <CardHeader>
            <CardTitle>Your profile</CardTitle>
          </CardHeader>
          <CardContent>
            {profile === null ? (
              <FormSkeleton rows={2} />
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
                  <Label>Sign-in email (read-only)</Label>
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
