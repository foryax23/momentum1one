import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

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
  const rows = q.data ?? [];
  return (
    <section className="mt-6 rounded-2xl border border-border bg-card p-4">
      <div className="flex items-center justify-between"><h2 className="font-bold">WhatsApp: waiting for agent</h2><span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">{rows.length}</span></div>
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
  return (
    <div className="mt-4 rounded-xl border border-border p-3">
      <div className="flex items-center justify-between gap-2 text-sm">
        <strong>WhatsApp</strong>
        <span className="text-xs text-muted-foreground">Welcome: {welcomeStatus}{t ? ` · ${LABEL[t.conv.status]}` : ""}</span>
      </div>
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
    </div>
  );
}
