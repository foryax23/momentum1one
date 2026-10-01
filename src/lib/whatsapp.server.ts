import { createOpenAI } from "@ai-sdk/openai";
import { streamText, tool, stepCountIs, type ModelMessage } from "ai";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { CAMPUS_COURSES } from "./offer-catalog";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/whatsapp";
export const WELCOME_TEMPLATE = "momentum_offer_welcome";
const STATUS_RANK: Record<string, number> = { accepted: 0, sent: 1, delivered: 2, read: 3, failed: 4 };

export function waDigits(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (d.startsWith("07")) return `44${d.slice(1)}`;
  if (d.startsWith("447")) return d;
  if (d.startsWith("7") && d.length === 10) return `44${d}`;
  return d;
}

async function gateway(path: string, body: unknown) {
  const lovable = process.env['LOVABLE_API_KEY'];
  const wa = process.env['WHATSAPP_API_KEY'];
  if (!lovable || !wa) throw new Error("WhatsApp is not configured");
  const res = await fetch(`${GATEWAY_URL}${path}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": wa, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`WhatsApp send failed (${res.status}): ${text.slice(0, 500)}`);
  const id = (JSON.parse(text) as { messages?: { id: string }[] }).messages?.[0]?.id;
  if (!id) throw new Error("WhatsApp send returned no message id");
  return id;
}

async function ensureConversation(phone: string, leadId: string | null) {
  const { data: existing, error } = await supabaseAdmin.from("whatsapp_conversations").select("*").eq("wa_phone", phone).maybeSingle();
  if (error) throw error;
  if (existing) {
    if (leadId && !existing.lead_id) await supabaseAdmin.from("whatsapp_conversations").update({ lead_id: leadId }).eq("id", existing.id);
    return existing;
  }
  let lead_id = leadId;
  if (!lead_id) {
    const local = `0${phone.slice(2)}`;
    const { data: leads } = await supabaseAdmin.from("leads").select("id, phone").order("created_at", { ascending: false }).limit(500);
    lead_id = leads?.find((l) => waDigits(l.phone) === phone || l.phone.replace(/\D/g, "") === local)?.id ?? null;
  }
  const { data, error: insErr } = await supabaseAdmin.from("whatsapp_conversations")
    .upsert({ wa_phone: phone, lead_id }, { onConflict: "wa_phone" }).select("*").single();
  if (insErr) throw insErr;
  return data;
}

/** Applies any status callbacks that arrived before the outbound id was saved. */
async function reconcileStatus(waMessageId: string) {
  const { data } = await supabaseAdmin.from("whatsapp_webhook_events").select("*")
    .eq("event", "whatsapp.status").is("processed_at", null).limit(50);
  for (const row of data ?? []) {
    if (JSON.stringify(row.payload).includes(waMessageId)) await processEvent(row.id);
  }
}

/** Sends the approved welcome template once per lead. Never throws. */
export async function sendWelcome(lead: { id: string; full_name: string; phone: string; selected_course: string | null; nearest_campus: string | null; ref_code: string }) {
  try {
    const { data: claimed } = await supabaseAdmin.from("leads").update({ whatsapp_status: "sending" })
      .eq("id", lead.id).eq("whatsapp_status", "pending").select("id");
    if (!claimed?.length) return;
    const phone = waDigits(lead.phone);
    const conv = await ensureConversation(phone, lead.id);
    const first = lead.full_name.trim().split(/\s+/)[0] ?? lead.full_name;
    const course = lead.selected_course ?? "your course";
    const campus = lead.nearest_campus ?? "your nearest campus";
    const body = `Hi ${first}, thank you for applying with Momentum One. Your personalised offer for ${course} at ${campus} is ready, reference ${lead.ref_code}.`;
    try {
      const id = await gateway("/messages", {
        messaging_product: "whatsapp", to: phone, type: "template",
        template: { name: WELCOME_TEMPLATE, language: { code: "en_GB" }, components: [{ type: "body", parameters: [first, course, campus, lead.ref_code].map((text) => ({ type: "text", text })) }] },
      });
      await supabaseAdmin.from("whatsapp_messages").insert({ conversation_id: conv.id, direction: "system", body, wa_message_id: id, status: "accepted" });
      await supabaseAdmin.from("leads").update({ whatsapp_status: "sent" }).eq("id", lead.id);
      await reconcileStatus(id);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await supabaseAdmin.from("whatsapp_messages").insert({ conversation_id: conv.id, direction: "system", body, status: "failed", error: message.slice(0, 1000) });
      await supabaseAdmin.from("leads").update({ whatsapp_status: "failed" }).eq("id", lead.id);
      console.error("WhatsApp welcome failed", message);
    }
  } catch (error) {
    console.error("WhatsApp welcome error", error);
  }
}

function catalogueText() {
  return Object.entries(CAMPUS_COURSES).map(([campus, courses]) =>
    `${campus}:\n${courses.map((c) => `- ${c.title} (${c.route}, ${c.university}): ${c.patterns.join("; ")}`).join("\n")}`).join("\n\n");
}

async function generateReply(conversationId: string) {
  const { data: conv } = await supabaseAdmin.from("whatsapp_conversations").select("*, leads(full_name, selected_course, study_route, nearest_campus, ref_code)").eq("id", conversationId).single();
  if (!conv || conv.status !== "bot") return null;
  const { data: history } = await supabaseAdmin.from("whatsapp_messages").select("direction, body").eq("conversation_id", conversationId).order("created_at").limit(60);
  const lead = conv.leads as { full_name: string; selected_course: string | null; study_route: string | null; nearest_campus: string | null; ref_code: string } | null;
  const messages: ModelMessage[] = (history ?? []).filter((m) => m.body).map((m) => ({ role: m.direction === "in" ? "user" : "assistant", content: m.body }));

  const system = `You are the Momentum One WhatsApp assistant. Momentum One is a UK student recruitment company that helps students apply to university degree courses taught at local campuses.
Write short, friendly WhatsApp replies in British English, at most 3 short paragraphs, plain text, no markdown headings, never use em dashes.
${lead ? `Student: ${lead.full_name}. Chosen course: ${lead.selected_course ?? "not chosen"} (${lead.study_route ?? "route not chosen"}) at ${lead.nearest_campus ?? "unknown campus"}. Reference ${lead.ref_code}.` : "This number is not linked to an application yet. Invite them to apply on the Momentum One website."}

Facts you may use. Never invent dates, fees, phone numbers, emails or addresses. Say "to be confirmed by an advisor" when unknown.
Courses and study patterns by campus:
${catalogueText()}
How to apply: 1) choose a course, 2) advisor call, 3) document check, 4) online pre-task, 5) PFF Day assessment at the campus, then enrolment.
Documents usually needed: proof of identity, share code or immigration status if relevant, proof of address, Duolingo English test if required, CV, previous qualifications.
Pre-task: 4 questions, about 150 words each, under 20% similarity, 2 attempts.
The personalised offer is not a confirmed university admission offer. Eligibility is confirmed after document review and assessment.
Student finance may be available for eligible students; an advisor confirms eligibility.

Call handover_to_agent when the student asks for a person, wants to book a call, is ready to apply, has a complaint, asks about their personal eligibility, finance, immigration or anything you cannot answer from the facts. After calling it, tell them an advisor will reply here soon.`;

  const lovable = process.env['LOVABLE_API_KEY'];
  if (!lovable) throw new Error("LOVABLE_API_KEY is not configured");
  let runId: string | undefined;
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: lovable,
    headers: { "Lovable-API-Key": lovable, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: async (input, init) => {
      const headers = new Headers(init?.headers);
      if (runId) headers.set("X-Lovable-AIG-Run-ID", runId);
      const res = await fetch(input, { ...init, headers });
      runId ??= res.headers.get("X-Lovable-AIG-Run-ID") ?? undefined;
      return res;
    },
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system,
    messages,
    stopWhen: stepCountIs(50),
    tools: {
      handover_to_agent: tool({
        description: "Move this chat to the human advisor queue.",
        inputSchema: z.object({ reason: z.string(), summary: z.string().describe("One or two sentences on what the student wants") }),
        execute: async ({ reason, summary }) => {
          await supabaseAdmin.from("whatsapp_conversations").update({ status: "queued", queued_at: new Date().toISOString(), summary: `${summary} (${reason})`.slice(0, 600), updated_at: new Date().toISOString() }).eq("id", conversationId);
          return { queued: true };
        },
      }),
    },
    providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
  });
  const text = (await result.text).trim();
  return text || null;
}

/** Claims and answers one pending inbound message. Safe to call repeatedly. */
async function answerInbound(messageRowId: string) {
  const { data: claimed } = await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "sending" })
    .eq("id", messageRowId).eq("reply_status", "pending").select("conversation_id").maybeSingle();
  if (!claimed) return;
  try {
    const { data: conv } = await supabaseAdmin.from("whatsapp_conversations").select("wa_phone, status").eq("id", claimed.conversation_id).single();
    if (!conv || conv.status !== "bot") { await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "skipped" }).eq("id", messageRowId); return; }
    const reply = await generateReply(claimed.conversation_id);
    if (!reply) { await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "skipped" }).eq("id", messageRowId); return; }
    const id = await gateway("/messages", { messaging_product: "whatsapp", to: conv.wa_phone, type: "text", text: { body: reply.slice(0, 4000) } });
    await supabaseAdmin.from("whatsapp_messages").insert({ conversation_id: claimed.conversation_id, direction: "bot", body: reply, wa_message_id: id, status: "accepted" });
    await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "sent" }).eq("id", messageRowId);
  } catch (error) {
    console.error("WhatsApp bot reply failed", error);
    await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "failed", error: String(error).slice(0, 1000) }).eq("id", messageRowId);
  }
}

type WaValue = {
  messages?: { id: string; from: string; type: string; text?: { body: string }; button?: { text: string }; interactive?: { button_reply?: { title: string }; list_reply?: { title: string } } }[];
  statuses?: { id: string; status: string; errors?: { title?: string; message?: string }[] }[];
  message_echoes?: { id: string; to: string; text?: { body: string }; type: string }[];
};

function valueOf(payload: unknown): WaValue {
  return ((payload as { entry?: { changes?: { value?: WaValue }[] }[] }).entry?.[0]?.changes?.[0]?.value) ?? {};
}

/** Processes one stored webhook event. Returns inbound message row ids that need a bot reply. */
export async function processEvent(eventId: string): Promise<string[]> {
  const { data: row, error } = await supabaseAdmin.from("whatsapp_webhook_events").select("*").eq("id", eventId).single();
  if (error || !row || row.processed_at) return [];
  const value = valueOf(row.payload);
  const toAnswer: string[] = [];
  try {
    if (row.event === "whatsapp.message") {
      for (const m of value.messages ?? []) {
        const conv = await ensureConversation(m.from, null);
        const body = m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? `[${m.type} message]`;
        const { data: ins, error: e } = await supabaseAdmin.from("whatsapp_messages")
          .upsert({ conversation_id: conv.id, direction: "in", body, wa_message_id: m.id, status: "received", reply_status: conv.status === "bot" ? "pending" : "skipped" }, { onConflict: "wa_message_id", ignoreDuplicates: true })
          .select("id, reply_status");
        if (e) throw e;
        await supabaseAdmin.from("whatsapp_conversations").update({ last_inbound_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", conv.id);
        const newRow = ins?.[0];
        if (newRow?.reply_status === "pending") toAnswer.push(newRow.id);
      }
    } else if (row.event === "whatsapp.status") {
      for (const s of value.statuses ?? []) {
        const { data: msg } = await supabaseAdmin.from("whatsapp_messages").select("id, status").eq("wa_message_id", s.id).maybeSingle();
        if (!msg) throw new Error("unmatched_status");
        if ((STATUS_RANK[s.status] ?? 0) > (STATUS_RANK[msg.status] ?? 0)) {
          const err = s.errors?.map((x) => x.message ?? x.title).join("; ") || null;
          await supabaseAdmin.from("whatsapp_messages").update({ status: s.status, ...(err ? { error: err } : {}) }).eq("id", msg.id);
        }
      }
    } else if (row.event === "whatsapp.smb_message_echoes") {
      for (const m of value.message_echoes ?? []) {
        const conv = await ensureConversation(m.to, null);
        await supabaseAdmin.from("whatsapp_messages").upsert({ conversation_id: conv.id, direction: "agent", body: m.text?.body ?? `[${m.type} message]`, wa_message_id: m.id, status: "sent" }, { onConflict: "wa_message_id", ignoreDuplicates: true });
        if (conv.status !== "closed") await supabaseAdmin.from("whatsapp_conversations").update({ status: "agent", updated_at: new Date().toISOString() }).eq("id", conv.id);
      }
    }
    await supabaseAdmin.from("whatsapp_webhook_events").update({ processed_at: new Date().toISOString(), processing_error: null }).eq("id", row.id);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await supabaseAdmin.from("whatsapp_webhook_events").update({ processing_error: message.slice(0, 1000), attempts: row.attempts + 1 }).eq("id", row.id);
    if (message !== "unmatched_status") throw e;
  }
  return toAnswer;
}

/** Bounded recovery for unfinished events and replies, run on each webhook call. */
export async function recoverPending() {
  const cutoff = new Date(Date.now() - 60_000).toISOString();
  const { data: events } = await supabaseAdmin.from("whatsapp_webhook_events").select("id")
    .is("processed_at", null).lt("received_at", cutoff).lt("attempts", 8).order("attempts").order("received_at").limit(5);
  for (const e of events ?? []) { try { await processEvent(e.id); } catch { /* retried later */ } }
  const { data: stale } = await supabaseAdmin.from("whatsapp_messages").select("id")
    .eq("reply_status", "sending").lt("created_at", new Date(Date.now() - 5 * 60_000).toISOString()).limit(3);
  for (const m of stale ?? []) await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "pending" }).eq("id", m.id).eq("reply_status", "sending");
  const { data: pending } = await supabaseAdmin.from("whatsapp_messages").select("id").eq("reply_status", "pending").lt("created_at", cutoff).limit(2);
  return (pending ?? []).map((p) => p.id);
}

export { answerInbound };
