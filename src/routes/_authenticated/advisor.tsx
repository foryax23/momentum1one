import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AccountShell } from "@/components/account-shell";
import { Button } from "@/components/ui/button";
import { getAccountHome, getAdvisorWorkspace, updateAssignedLead } from "@/lib/accounts.functions";

export const Route = createFileRoute("/_authenticated/advisor")({
  beforeLoad: async () => { const account = await getAccountHome(); if (account.role !== "advisor") throw redirect({ to: account.destination }); },
  head: () => ({ meta: [
    { title: "Advisor workspace | Momentum One" }, { name: "description", content: "Momentum One advisor application workspace." },
    { property: "og:title", content: "Advisor workspace | Momentum One" }, { property: "og:description", content: "Momentum One advisor application workspace." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }, { name: "robots", content: "noindex" },
  ] }), component: AdvisorDashboard,
});

const STATUSES = ["new", "contacted", "applied", "enrolled", "lost"] as const;
type AdvisorLead = { id: string; ref_code: string; full_name: string; email: string; phone: string; city: string; selected_course: string | null; study_route: string | null; nearest_campus: string | null; status: string; notes: string | null; whatsapp_status: string; advisor_user_id: string | null; created_at: string };

function AdvisorDashboard() {
  const load = useServerFn(getAdvisorWorkspace); const save = useServerFn(updateAssignedLead); const qc = useQueryClient();
  const query = useQuery({ queryKey: ["advisor-workspace"], queryFn: () => load() });
  const [open, setOpen] = useState<AdvisorLead | null>(null);
  async function update(status: typeof STATUSES[number], notes: string) { if (!open) return; try { await save({ data: { leadId: open.id, status, notes } }); toast.success("Application updated"); setOpen({ ...open, status, notes }); qc.invalidateQueries({ queryKey: ["advisor-workspace"] }); } catch (error) { toast.error(error instanceof Error ? error.message : "Could not update"); } }
  return <AccountShell eyebrow="Advisor workspace" title="Assigned students">
    <div className="mt-8 grid gap-4 sm:grid-cols-3"><Metric label="Assigned" value={query.data?.length ?? 0} /><Metric label="New" value={query.data?.filter((x) => x.status === "new").length ?? 0} /><Metric label="In progress" value={query.data?.filter((x) => x.status === "contacted" || x.status === "applied").length ?? 0} /></div>
    <div className="mt-6 grid gap-3">{query.data?.map((lead) => <button key={lead.id} onClick={() => setOpen(lead)} className="grid w-full gap-3 rounded-xl border border-border bg-card p-5 text-left transition hover:border-teal sm:grid-cols-[1.4fr_1fr_auto] sm:items-center"><div><strong className="text-primary">{lead.full_name}</strong><p className="text-xs text-muted-foreground">{lead.ref_code} · {lead.email}</p></div><div className="text-sm"><p>{lead.selected_course ?? "Course to confirm"}</p><p className="text-xs text-muted-foreground">{lead.nearest_campus ?? lead.city}</p></div><span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-bold capitalize">{lead.status}</span></button>)}{!query.isLoading && !query.data?.length && <p className="rounded-xl border border-border bg-card p-8 text-muted-foreground">No applications are assigned to you yet.</p>}</div>
    {open && <LeadPanel lead={open} onClose={() => setOpen(null)} onSave={update} />}
  </AccountShell>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-border bg-card p-5"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-3xl font-bold text-primary">{value}</p></div>; }
function LeadPanel({ lead, onClose, onSave }: { lead: AdvisorLead; onClose: () => void; onSave: (status: typeof STATUSES[number], notes: string) => void }) {
  const [notes, setNotes] = useState(lead.notes ?? ""); const [status, setStatus] = useState<typeof STATUSES[number]>(STATUSES.includes(lead.status as typeof STATUSES[number]) ? lead.status as typeof STATUSES[number] : "new");
  return <div className="fixed inset-0 z-50 flex items-end justify-end bg-primary/40 backdrop-blur-sm" onClick={onClose}><section className="h-[92vh] w-full max-w-xl overflow-y-auto rounded-t-2xl bg-card p-6 sm:h-full sm:rounded-none sm:p-8" onClick={(event) => event.stopPropagation()}><div className="flex justify-between gap-4"><div><p className="text-xs font-bold text-teal">{lead.ref_code}</p><h2 className="text-2xl font-bold text-primary">{lead.full_name}</h2></div><Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">×</Button></div><dl className="mt-6 grid grid-cols-2 gap-4 text-sm"><Info label="Email" value={lead.email} /><Info label="Phone" value={lead.phone} /><Info label="Course" value={lead.selected_course ?? "To confirm"} /><Info label="Campus" value={lead.nearest_campus ?? lead.city} /></dl><label className="mt-7 block text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Application status</label><select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="mt-2 h-12 w-full rounded-lg border border-input bg-card px-3">{STATUSES.map((item) => <option key={item}>{item}</option>)}</select><label className="mt-5 block text-xs font-bold uppercase tracking-[.14em] text-muted-foreground">Advisor notes</label><textarea rows={7} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 w-full rounded-lg border border-input p-3" /><div className="mt-6 grid gap-2 sm:grid-cols-2"><a href={`https://wa.me/${lead.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-12 items-center justify-center rounded-lg border border-primary font-bold text-primary">Open WhatsApp</a><Button className="h-12" onClick={() => onSave(status, notes)}>Save application</Button></div></section></div>;
}
function Info({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-muted-foreground">{label}</dt><dd className="mt-1 font-semibold text-primary">{value}</dd></div>; }