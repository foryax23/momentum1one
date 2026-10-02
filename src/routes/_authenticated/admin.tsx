import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { IconDoor, IconDownload } from "@/components/icons";
import { plural } from "@/components/admin/chart-kit";
import { LeadDetail } from "@/components/admin/lead-detail";
import { downloadCsv, filterLeads, leadsCsv, NO_FILTERS, NONE, OPEN, type Lead, type LeadFilters } from "@/components/admin/lead-model";
import { LeadsTab } from "@/components/admin/leads-table";
import { Overview } from "@/components/admin/overview";
import { LeadsError, LeadsLoading, Notice, RefreshButton } from "@/components/admin/parts";
import { AdminShell, useAdminTab } from "@/components/admin/shell";
import { TeamTab } from "@/components/admin/team";
import { WhatsAppTab } from "@/components/admin/whatsapp-tab";
import { Button } from "@/components/ui/button";
import { WhatsAppHealth, WhatsAppQueue, WhatsAppThread } from "@/components/whatsapp-admin";
import { supabase } from "@/integrations/supabase/client";
import { assignAdvisor, getAdvisors, inviteAdvisor } from "@/lib/accounts.functions";
import { LEADS_LOAD_LIMIT } from "@/lib/lead-metrics";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Leads dashboard | Momentum One" },
      { name: "description", content: "Momentum One admin leads dashboard." },
      { property: "og:title", content: "Leads dashboard | Momentum One" },
      { property: "og:description", content: "Momentum One admin leads dashboard." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Admin,
});

/** The newest leads up to the load limit, and how many leads exist in all. */
type LeadsData = { rows: Lead[]; total: number };
const NO_LEADS: Lead[] = [];
const CLOCK = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit" });

function Admin() {
  const nav = useNavigate();
  const qc = useQueryClient();
  const [, setTab] = useAdminTab();
  const [filters, setFilters] = useState<LeadFilters>(NO_FILTERS);
  const [openId, setOpenId] = useState<string | null>(null);
  // a lead opened from the WhatsApp queue can be older than the loaded ones; it is fetched on its own and kept here
  const [extra, setExtra] = useState<Lead | null>(null);
  const loadAdvisors = useServerFn(getAdvisors);
  const invite = useServerFn(inviteAdvisor);
  const assign = useServerFn(assignAdvisor);

  const role = useQuery({
    queryKey: ["is-admin"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return false;
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      return !!data;
    },
  });
  const advisors = useQuery({ queryKey: ["advisors"], enabled: role.data === true, queryFn: () => loadAdvisors() });

  const leads = useQuery({
    queryKey: ["leads"],
    enabled: role.data === true,
    queryFn: async (): Promise<LeadsData> => {
      const { data, error, count } = await supabase.from("leads").select("*", { count: "exact" }).order("created_at", { ascending: false }).limit(LEADS_LOAD_LIMIT);
      if (error) throw error;
      return { rows: data as Lead[], total: count ?? data.length };
    },
  });
  // the number on the WhatsApp tab: chats waiting for a person, whichever tab is open (the queue itself only loads inside its tab)
  const waiting = useQuery({
    queryKey: ["wa", "queue-count"],
    enabled: role.data === true,
    refetchInterval: 30000,
    queryFn: async () => {
      const { count, error } = await supabase.from("whatsapp_conversations").select("id", { count: "exact", head: true }).eq("status", "queued");
      if (error) throw error;
      return count ?? 0;
    },
  });

  const all = leads.data?.rows ?? NO_LEADS;
  // undefined until the advisor list has loaded: "not loaded" is never shown as "no advisors" or "former advisor"
  const team = advisors.data;
  const rows = useMemo(() => filterLeads(all, filters), [all, filters]);
  const open = openId === null ? null : all.find((lead) => lead.id === openId) ?? (extra?.id === openId ? extra : null);

  function patch(id: string, change: Partial<Lead>) {
    qc.setQueryData<LeadsData>(["leads"], (old) => old && { ...old, rows: old.rows.map((lead) => (lead.id === id ? { ...lead, ...change } : lead)) });
    setExtra((lead) => (lead?.id === id ? { ...lead, ...change } : lead));
  }

  // the change shows at once; the reload that follows confirms it, or puts the old value back when the save failed
  async function update(id: string, change: Partial<Lead>) {
    patch(id, change);
    const { error } = await supabase.from("leads").update(change).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Saved");
    qc.invalidateQueries({ queryKey: ["leads"] });
  }

  async function assignTo(id: string, advisorId: string | null) {
    await assign({ data: { leadId: id, advisorId } });
    patch(id, { advisor_user_id: advisorId });
    qc.invalidateQueries({ queryKey: ["leads"] });
  }

  async function openLead(id: string) {
    if (all.some((lead) => lead.id === id)) { setOpenId(id); return; }
    const { data, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
    if (error || !data) { toast.error("Could not open that lead."); return; }
    setExtra(data as Lead);
    setOpenId(id);
  }

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    nav({ to: "/auth", replace: true });
  }

  function exportCsv(everything = false) {
    if (!leads.data) { toast("The leads are still loading."); return; }
    // the advisor column needs the advisor list: wait for it while it loads, leave the column out when it failed
    if (!team && !advisors.isError) { toast("The advisor list is still loading. Try again in a moment."); return; }
    const set = everything ? all : rows;
    downloadCsv(leadsCsv(set, team));
    const without = team ? "" : ", without the advisor column (the advisor list could not be loaded)";
    if (set.length < all.length) toast.success(`Exported the ${plural(set.length, "lead")} that match your filters${without}`, { action: { label: `Export all ${all.length}`, onClick: () => exportCsv(true) } });
    else toast.success(`Exported ${plural(set.length, "lead")}${without}`);
  }

  function showLeads(next: Partial<LeadFilters>) {
    setFilters({ ...NO_FILTERS, ...next });
    setTab("leads");
  }

  if (role.isLoading) return <div className="grid min-h-screen place-items-center text-muted-foreground">Loading…</div>;
  if (!role.data)
    return (
      <div className="grid min-h-screen place-items-center px-5 text-center">
        <div><h1 className="text-2xl font-bold">No admin access</h1><p className="mt-2 text-sm text-muted-foreground">Ask an existing admin to grant you access.</p>
          <button onClick={signOut} className="mt-6 rounded-xl border border-border px-4 py-2 text-sm">Sign out</button></div>
      </div>
    );

  const retry = () => { leads.refetch(); };
  // first load and a failed first load take the place of the panel; a failed refresh keeps the last leads on screen and says so
  const gate = leads.data ? null : leads.isError ? <LeadsError message={leads.error.message} onRetry={retry} retrying={leads.isFetching} /> : null;
  const stale = leads.data && leads.isRefetchError && (
    <Notice title="The leads could not be refreshed" action={<Button variant="outline" size="sm" onClick={retry} disabled={leads.isFetching}>{leads.isFetching ? "Trying" : "Try again"}</Button>}>
      You are looking at what was loaded at {CLOCK.format(leads.dataUpdatedAt)}. Changes you save still go through.
    </Notice>
  );
  const teamDown = !team && advisors.isError && (
    <Notice title="The advisor list could not be loaded" action={<Button variant="outline" size="sm" onClick={() => { advisors.refetch(); }} disabled={advisors.isFetching}>{advisors.isFetching ? "Trying" : "Try again"}</Button>}>
      Assigned leads read “Assigned” without a name, and a lead cannot be given to an advisor until the list loads. Everything else works.
    </Notice>
  );
  const withState = (panel: React.ReactNode, tiles = 5) => gate ?? (leads.data ? <div className="grid gap-4">{stale}{panel}</div> : <LeadsLoading tiles={tiles} />);

  return (
    <>
      <AdminShell
        counts={{ leads: leads.data ? all.length : undefined, whatsapp: waiting.data || undefined, team: team?.length }}
        countNouns={{ leads: "leads loaded", whatsapp: "chats waiting for an agent", team: "advisors" }}
        actions={<>
          <RefreshButton onRefresh={() => { leads.refetch(); advisors.refetch(); }} fetching={leads.isFetching} updatedAt={leads.dataUpdatedAt} />
          <Button variant="outline" aria-label="Export CSV" onClick={() => exportCsv()} title={rows.length < all.length ? `Exports the ${plural(rows.length, "lead")} that match the filters on the Leads tab` : "Export CSV"} className="px-3 sm:px-4"><IconDownload size={18} /><span className="hidden sm:inline">Export CSV</span></Button>
          <Button variant="outline" size="icon" aria-label="Sign out" title="Sign out" onClick={signOut} className="h-10 w-10"><IconDoor size={18} /></Button>
        </>}
        panels={{
          overview: withState(<Overview leads={all} advisors={team} total={leads.data?.total} now={leads.dataUpdatedAt} onOpenLead={openLead}
            onViewLeads={() => showLeads({ status: "new", advisor: NONE })} onViewUnassigned={() => showLeads({ status: OPEN, advisor: NONE })} />),
          leads: withState(<>{teamDown}<LeadsTab leads={all} rows={rows} advisors={team} filters={filters} onFilters={setFilters} onOpen={openLead} openId={openId} total={leads.data?.total} /></>, 0),
          whatsapp: <WhatsAppTab leads={leads.data?.rows} total={leads.data?.total} health={<WhatsAppHealth />} queue={<WhatsAppQueue onOpenLead={openLead} />} />,
          team: <TeamTab leads={all} advisors={team} total={leads.data?.total} leadsState={leads.data ? (teamDown ? <div>{teamDown}</div> : undefined) : withState(null, 0)} onViewLeads={(advisor) => showLeads({ advisor })}
            onInvite={async (input) => { await invite({ data: input }); qc.invalidateQueries({ queryKey: ["advisors"] }); }} />,
        }}
      />
      {/* outside the shell: only the active tab is mounted, and every tab can open a lead */}
      <LeadDetail lead={open} advisors={team} onClose={() => setOpenId(null)} onSave={(change) => { if (open) update(open.id, change); }} onAssign={(advisorId) => (open ? assignTo(open.id, advisorId) : Promise.resolve())}
        thread={(lead) => <WhatsAppThread leadId={lead.id} welcomeStatus={lead.whatsapp_status} />} />
    </>
  );
}
