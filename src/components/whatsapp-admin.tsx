import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getAdmissionDocumentUrl, getAdmissionPack, getWhatsAppTemplateHealth, queueAdmissionsReview, resendWelcome, updateAdmissionDocument } from "@/lib/whatsapp-admin.functions";

const WELCOME: Record<string, string> = { pending: "Not sent yet", sending: "Sending", sent: "Sent", failed: "Failed", awaiting_template: "Waiting for Meta approval" };

export function WhatsAppHealth() {
  const templateHealth = useServerFn(getWhatsAppTemplateHealth);
  const q = useQuery({ queryKey: ["wa", "health"], refetchInterval: 30000, queryFn: async () => {
    const { data, count } = await supabase.from("whatsapp_webhook_events").select("received_at", { count: "exact" }).order("received_at", { ascending: false }).limit(1);
    const template = await templateHealth();
    return { count: count ?? 0, last: data?.[0]?.received_at ?? null, template };
  }});
  const ok = (q.data?.count ?? 0) > 0;
  const template = q.data?.template.status;
  return <div className={cn("mt-3 grid gap-1 rounded-xl border px-3 py-2 text-xs", ok ? "border-border text-muted-foreground" : "border-destructive/40 text-destructive")}>
    <p>{q.isLoading ? "Checking WhatsApp connection" : ok ? `WhatsApp is reaching this site. Last update ${new Date(q.data?.last ?? 0).toLocaleString("en-GB")}.` : "No WhatsApp updates have reached this site yet. Send a message to your business number to test. If nothing appears, choose this project under Connectors, WhatsApp, Incoming messages."}</p>
    {!q.isLoading && <p>Welcome message: <strong>{template === "APPROVED" ? "Approved" : template === "PENDING" ? "Waiting for Meta review" : template === "REJECTED" ? "Rejected by Meta" : "Not found"}</strong>.</p>}
  </div>;
}

const LABEL: Record<string, string> = { bot: "Bot chatting", queued: "Waiting for agent", agent: "With agent", closed: "Closed" };

async function setStatus(id: string, status: string, qc: ReturnType<typeof useQueryClient>) {
  const { error } = await supabase.from("whatsapp_conversations").update({ status, updated_at: new Date().toISOString(), ...(status === "bot" ? { queued_at: null } : {}) }).eq("id", id);
  if (error) { toast.error(error.message); return; }
  qc.invalidateQueries({ queryKey: ["wa"] });
  toast.success("Updated");
}

function waLink(phone: string) { return `https://wa.me/${phone}`; }

export function WhatsAppQueue({ onOpenLead }: { onOpenLead: (leadId: string) => void }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["wa", "queue"],
    refetchInterval: 20000,
    queryFn: async () => {
      const { data, error } = await supabase.from("whatsapp_conversations")
        .select("id, wa_phone, status, queued_at, summary, lead_id, leads(full_name, selected_course, nearest_campus)")
        .eq("status", "queued").order("queued_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
  const outside = useQuery({
    queryKey: ["wa", "outside"],
    refetchInterval: 60000,
    queryFn: async () => {
      const { data, error } = await supabase.from("whatsapp_conversations")
        .select("id, wa_phone, last_inbound_at").eq("bot_enabled", false).not("last_inbound_at", "is", null)
        .order("last_inbound_at", { ascending: false }).limit(20);
      if (error) throw error;
      return data ?? [];
    },
  });
  const rows = q.data ?? [];
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between"><h2 className="font-bold">WhatsApp: waiting for agent</h2><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">{rows.length}</span></div>
      {(outside.data?.length ?? 0) > 0 && <details className="mt-2 text-xs text-muted-foreground"><summary className="cursor-pointer">Not from website: {outside.data!.length} chats (bot does not reply, answer from the WhatsApp Business app)</summary>
        <ul className="mt-1 space-y-0.5">{outside.data!.map((c) => <li key={c.id}>+{c.wa_phone}{c.last_inbound_at ? ` · ${new Date(c.last_inbound_at).toLocaleString("en-GB")}` : ""}</li>)}</ul></details>}
      {rows.length === 0 ? <p className="mt-2 text-sm text-muted-foreground">No students waiting. The assistant is handling chats.</p> : (
        <ul className="mt-3 divide-y divide-border">
          {rows.map((c) => {
            const lead = c.leads as { full_name: string; selected_course: string | null; nearest_campus: string | null } | null;
            const mins = c.queued_at ? Math.round((Date.now() - new Date(c.queued_at).getTime()) / 60000) : 0;
            return <li key={c.id} className="grid gap-2 py-3 sm:grid-cols-[1fr_auto] sm:items-center">
              <div className="min-w-0">
                <button className="text-left font-semibold text-primary" onClick={() => c.lead_id && onOpenLead(c.lead_id)}>{lead?.full_name ?? `+${c.wa_phone}`}</button>
                <p className="text-xs text-muted-foreground">{lead?.selected_course ?? "No application"}{lead?.nearest_campus ? ` · ${lead.nearest_campus}` : ""} · waiting {mins < 60 ? `${mins} min` : `${Math.round(mins / 60)} h`}</p>
                {c.summary && <p className="mt-1 text-sm">{c.summary}</p>}
              </div>
              <div className="flex flex-wrap gap-2">
                <a href={waLink(c.wa_phone)} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">Open in WhatsApp</a>
                <button onClick={() => setStatus(c.id, "agent", qc)} className="rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">Take chat</button>
              </div>
            </li>;
          })}
        </ul>
      )}
    </section>
  );
}

export function WhatsAppThread({ leadId, welcomeStatus }: { leadId: string; welcomeStatus: string }) {
  const qc = useQueryClient();
  const q = useQuery({
    queryKey: ["wa", "thread", leadId],
    queryFn: async () => {
      const { data: conv, error } = await supabase.from("whatsapp_conversations").select("id, wa_phone, status").eq("lead_id", leadId).maybeSingle();
      if (error) throw error;
      if (!conv) return null;
      const { data: msgs, error: e2 } = await supabase.from("whatsapp_messages").select("id, direction, body, status, error, created_at").eq("conversation_id", conv.id).order("created_at");
      if (e2) throw e2;
      return { conv, msgs: msgs ?? [] };
    },
  });
  const t = q.data;
  const resend = useServerFn(resendWelcome);
  const [busy, setBusy] = useState(false);
  async function doResend() {
    setBusy(true);
    try { const r = await resend({ data: { leadId } }); toast.success(`Welcome: ${WELCOME[r.status] ?? r.status}`); qc.invalidateQueries(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not resend"); }
    finally { setBusy(false); }
  }
  return (
    <div className="mt-4 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <strong>WhatsApp</strong>
        <span className="text-xs text-muted-foreground">Welcome: {WELCOME[welcomeStatus] ?? welcomeStatus}{t ? ` · ${LABEL[t.conv.status]}` : ""}</span>
      </div>
      {welcomeStatus !== "sent" && welcomeStatus !== "sending" && <button onClick={doResend} disabled={busy} className="mt-2 rounded-lg border border-border px-3 py-1.5 text-xs font-semibold disabled:opacity-60">{busy ? "Sending" : "Resend welcome"}</button>}
      {t && <>
        <div className="mt-2 max-h-56 space-y-1.5 overflow-y-auto">
          {t.msgs.map((m) => <div key={m.id} className={cn("max-w-[85%] rounded-lg px-2.5 py-1.5 text-xs", m.direction === "in" ? "bg-secondary" : "ml-auto bg-primary/10")}>
            <span className="block text-[10px] font-semibold uppercase text-muted-foreground">{m.direction === "in" ? "Student" : m.direction === "bot" ? "Assistant" : m.direction === "agent" ? "Advisor" : "Welcome"} · {m.status}</span>
            <span className="whitespace-pre-wrap">{m.body}</span>{m.error && <span className="block text-destructive">{m.error.slice(0, 160)}</span>}
          </div>)}
        </div>
        <div className="mt-2 flex flex-wrap gap-2">
          <a href={waLink(t.conv.wa_phone)} target="_blank" rel="noreferrer" className="rounded-lg border border-border px-3 py-1.5 text-xs font-semibold">Open in WhatsApp</a>
          {t.conv.status !== "closed" && <button onClick={() => setStatus(t.conv.id, "closed", qc)} className="rounded-lg border border-border px-3 py-1.5 text-xs">Mark as handled</button>}
          {t.conv.status !== "bot" && <button onClick={() => setStatus(t.conv.id, "bot", qc)} className="rounded-lg border border-border px-3 py-1.5 text-xs">Hand back to bot</button>}
        </div>
      </>}
      <AdmissionsPack leadId={leadId} />
    </div>
  );
}

const CHECKLIST = [
  ["identity", "Passport or ID"],
  ["proof_of_address", "Proof of address"],
  ["immigration_status", "Immigration or share code"],
  ["qualifications", "Qualifications"],
  ["english_evidence", "English evidence"],
  ["cv", "CV"],
] as const;

function AdmissionsPack({ leadId }: { leadId: string }) {
  const loadPack = useServerFn(getAdmissionPack);
  const openDocument = useServerFn(getAdmissionDocumentUrl);
  const updateDocument = useServerFn(updateAdmissionDocument);
  const queueReview = useServerFn(queueAdmissionsReview);
  const qc = useQueryClient();
  const [busy, setBusy] = useState<string | null>(null);
  const q = useQuery({ queryKey: ["wa", "admissions", leadId], queryFn: () => loadPack({ data: { leadId } }) });
  const documents = q.data?.documents ?? [];

  async function open(id: string) {
    setBusy(id);
    try { const { url } = await openDocument({ data: { documentId: id } }); window.open(url, "_blank", "noopener,noreferrer"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not open document"); }
    finally { setBusy(null); }
  }

  async function mark(id: string, action: "reviewed" | "replacement_requested") {
    const reason = action === "replacement_requested" ? window.prompt("What should the student replace or improve?") : null;
    if (action === "replacement_requested" && reason === null) return;
    setBusy(id);
    try { await updateDocument({ data: { documentId: id, action, reason } }); await qc.invalidateQueries({ queryKey: ["wa", "admissions", leadId] }); toast.success("Document updated"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not update document"); }
    finally { setBusy(null); }
  }

  async function ready() {
    setBusy("review");
    try { await queueReview({ data: { leadId } }); qc.invalidateQueries({ queryKey: ["wa"] }); toast.success("Added to advisor review"); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Could not queue review"); }
    finally { setBusy(null); }
  }

  return <section className="mt-4 border-t border-border pt-4">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div><h3 className="text-sm font-bold">Admissions pack</h3><p className="text-xs text-muted-foreground">Language: {q.data?.conversation?.detected_language ?? "Detecting"} · Step: {(q.data?.conversation?.admissions_step ?? "not started").replaceAll("_", " ")}</p></div>
      <Button size="sm" variant="outline" onClick={ready} disabled={busy === "review"}>Ready for review</Button>
    </div>
    <p className="mt-2 text-xs text-muted-foreground">Bot: {q.data?.conversation?.bot_enabled ? `on (${q.data.conversation.activated_via === "ref_code" ? "reference code" : "welcome message"})` : "off, not from website"}</p>
    {(() => {
      const profile = (q.data?.conversation?.profile ?? {}) as Record<string, string>;
      const rows = Object.entries(profile).filter(([, v]) => v);
      return rows.length ? <dl className="mt-2 grid gap-1 rounded-lg bg-secondary/50 p-2.5 text-xs sm:grid-cols-2">
        {rows.map(([k, v]) => <div key={k}><dt className="text-muted-foreground">{k.replaceAll("_", " ")}</dt><dd className="font-medium">{v}</dd></div>)}
      </dl> : null;
    })()}
    <ul className="mt-3 space-y-2">
      {CHECKLIST.map(([type, label]) => {
        const files = documents.filter((document) => document.document_type === type && document.status !== "replaced");
        return <li key={type} className="rounded-lg bg-secondary/50 p-2.5">
          <div className="flex items-center justify-between gap-3 text-xs"><strong>{label}</strong><span className={files.length ? "text-primary" : "text-muted-foreground"}>{files.length ? `${files.length} received` : "Missing"}</span></div>
          {files.map((document) => <div key={document.id} className="mt-2 grid gap-2 border-t border-border pt-2 text-xs sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
            <div className="min-w-0"><p className="truncate">{document.original_filename ?? label}</p><p className="text-muted-foreground">{Math.ceil(document.file_size / 1024)} KB · {document.status.replaceAll("_", " ")}</p>{document.replacement_reason && <p className="text-destructive">{document.replacement_reason}</p>}</div>
            <div className="flex flex-wrap gap-1.5">
              <Button size="sm" variant="outline" disabled={busy === document.id} onClick={() => open(document.id)}>Open</Button>
              {document.status !== "reviewed" && <Button size="sm" variant="outline" disabled={busy === document.id} onClick={() => mark(document.id, "reviewed")}>Reviewed</Button>}
              <Button size="sm" variant="outline" disabled={busy === document.id} onClick={() => mark(document.id, "replacement_requested")}>Replace</Button>
            </div>
          </div>)}
        </li>;
      })}
    </ul>
  </section>;
}
