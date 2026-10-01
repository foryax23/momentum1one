import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Download, LogOut, Search, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { UK_CITIES } from "@/lib/funnel";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Leads dashboard — Momentum One" },
      { name: "description", content: "Momentum One admin leads dashboard." },
      { property: "og:title", content: "Leads dashboard — Momentum One" },
      { property: "og:description", content: "Momentum One admin leads dashboard." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

const STATUSES = ["new", "contacted", "applied", "enrolled", "lost"] as const;

type Lead = {
  id: string; ref_code: string; full_name: string; email: string; phone: string; city: string;
  interest: string | null; intake: string | null; status: string; notes: string | null; created_at: string;
};

function Admin() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [city, setCity] = useState("");
  const [status, setStatus] = useState("");
  const [open, setOpen] = useState<Lead | null>(null);

  const role = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user!.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });

  const leads = useQuery({
    queryKey: ["leads"],
    enabled: role.data === true,
    queryFn: async () => {
      const { data, error } = await supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(1000);
      if (error) throw error;
      return data as Lead[];
    },
  });

  const rows = useMemo(() => {
    const s = q.toLowerCase();
    return (leads.data ?? []).filter((l) =>
      (!city || l.city === city) && (!status || l.status === status) &&
      (!s || [l.full_name, l.email, l.phone, l.ref_code].some((v) => v.toLowerCase().includes(s))));
  }, [leads.data, q, city, status]);

  const stats = useMemo(() => {
    const all = leads.data ?? [];
    const week = all.filter((l) => Date.now() - new Date(l.created_at).getTime() < 7 * 864e5).length;
    const counts: Record<string, number> = {};
    all.forEach((l) => (counts[l.city] = (counts[l.city] ?? 0) + 1));
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c, n]) => `${c} (${n})`).join(", ");
    return { total: all.length, week, top: top || "—" };
  }, [leads.data]);

  async function update(id: string, patch: Partial<Lead>) {
    const { error } = await supabase.from("leads").update(patch).eq("id", id);
    if (error) return toast.error(error.message);
    qc.invalidateQueries({ queryKey: ["leads"] });
    toast.success("Saved");
  }

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  function exportCsv() {
    const head = ["ref_code", "full_name", "email", "phone", "city", "interest", "intake", "status", "created_at"] as const;
    const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [head.join(","), ...rows.map((r) => head.map((h) => esc(r[h])).join(","))].join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  if (role.isLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (!role.data)
    return (
      <div className="grid min-h-screen place-items-center px-5 text-center">
        <div><h1 className="text-2xl font-bold">No admin access</h1><p className="mt-2 text-sm text-muted-foreground">Ask an existing admin to grant you access.</p>
          <button onClick={signOut} className="mt-6 rounded-xl border border-border px-4 py-2 text-sm">Sign out</button></div>
      </div>
    );

  return (
    <main className="mx-auto max-w-7xl px-4 py-6 sm:px-8">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <img src={logo} alt="" width={40} height={40} className="h-10 w-10 shrink-0 rounded-full bg-foreground p-0.5" />
          <h1 className="truncate text-xl font-bold sm:text-2xl">Leads</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-secondary"><Download className="h-4 w-4" /><span className="hidden sm:inline">Export CSV</span></button>
          <button onClick={signOut} aria-label="Sign out" className="rounded-xl border border-border px-3 py-2 hover:bg-secondary"><LogOut className="h-4 w-4" /></button>
        </div>
      </header>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Card l="Total leads" v={String(stats.total)} />
        <Card l="Last 7 days" v={String(stats.week)} />
        <Card l="Top cities" v={stats.top} small />
      </div>

      <div className="mt-6 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, phone, ref…" className="w-full rounded-xl border border-input bg-secondary/40 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-primary" />
        </div>
        <select value={city} onChange={(e) => setCity(e.target.value)} className="rounded-xl border border-input bg-secondary px-3 py-2.5 text-sm">
          <option value="">All cities</option>{UK_CITIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-input bg-secondary px-3 py-2.5 text-sm capitalize">
          <option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-secondary/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr><th className="p-3">Name</th><th className="p-3">Contact</th><th className="p-3">City</th><th className="p-3">Interest</th><th className="p-3">Status</th><th className="p-3">Date</th></tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id} onClick={() => setOpen(l)} className="cursor-pointer border-t border-border hover:bg-secondary/40">
                <td className="p-3"><div className="font-semibold">{l.full_name}</div><div className="text-xs text-muted-foreground">{l.ref_code}</div></td>
                <td className="p-3"><div>{l.email}</div><div className="text-xs text-muted-foreground">{l.phone}</div></td>
                <td className="p-3">{l.city}</td>
                <td className="p-3"><div>{l.interest ?? "—"}</div><div className="text-xs text-muted-foreground">{l.intake ?? ""}</div></td>
                <td className="p-3"><Badge s={l.status} /></td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString("en-GB", { dateStyle: "short", timeStyle: "short" })}</td>
              </tr>
            ))}
            {!leads.isLoading && rows.length === 0 && <tr><td colSpan={6} className="p-10 text-center text-muted-foreground">No leads yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {open && <Detail lead={open} onClose={() => setOpen(null)} onSave={(p) => { update(open.id, p); setOpen({ ...open, ...p }); }} />}
    </main>
  );
}

function Card({ l, v, small }: { l: string; v: string; small?: boolean }) {
  return <div className="glass rounded-2xl p-5"><div className="text-xs text-muted-foreground">{l}</div><div className={cn("mt-1 font-display font-bold", small ? "text-sm" : "text-3xl")}>{v}</div></div>;
}

function Badge({ s }: { s: string }) {
  const tone: Record<string, string> = { new: "bg-primary/20 text-primary", contacted: "bg-gold/20 text-gold", applied: "bg-accent/40 text-foreground", enrolled: "bg-chart-4/20 text-chart-4", lost: "bg-destructive/20 text-destructive" };
  return <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium capitalize", tone[s] ?? "bg-secondary")}>{s}</span>;
}

function Detail({ lead, onClose, onSave }: { lead: Lead; onClose: () => void; onSave: (p: Partial<Lead>) => void }) {
  const [notes, setNotes] = useState(lead.notes ?? "");
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-background/70 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg rounded-t-3xl border border-border bg-popover p-6 sm:rounded-3xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0"><h2 className="truncate text-xl font-bold">{lead.full_name}</h2><p className="text-xs text-muted-foreground">{lead.ref_code}</p></div>
          <button onClick={onClose} aria-label="Close"><X className="h-5 w-5" /></button>
        </div>
        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <Row k="Email" v={<a href={`mailto:${lead.email}`} className="text-primary">{lead.email}</a>} />
          <Row k="Phone" v={<a href={`tel:${lead.phone}`} className="text-primary">{lead.phone}</a>} />
          <Row k="City" v={lead.city} /><Row k="Interest" v={lead.interest ?? "—"} /><Row k="Intake" v={lead.intake ?? "—"} />
          <Row k="Created" v={new Date(lead.created_at).toLocaleString("en-GB")} />
        </dl>
        <div className="mt-5 flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <button key={s} onClick={() => onSave({ status: s })} className={cn("rounded-full border px-3 py-1.5 text-xs capitalize", lead.status === s ? "border-primary bg-primary/20" : "border-border")}>{s}</button>
          ))}
        </div>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={2000} rows={4} placeholder="Notes…" className="mt-4 w-full rounded-xl border border-input bg-secondary/40 p-3 text-sm outline-none focus:border-primary" />
        <button onClick={() => onSave({ notes })} className="mt-3 w-full rounded-xl bg-launch py-3 font-display font-semibold text-primary-foreground">Save notes</button>
      </div>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return <div><dt className="text-xs text-muted-foreground">{k}</dt><dd className="truncate">{v}</dd></div>;
}
