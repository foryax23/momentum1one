import { createHash } from "node:crypto";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText, type ModelMessage } from "ai";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { CAMPUS_COURSES } from "./offer-catalog";
import { createAiRunIdFetch } from "./ai-run-id.server";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/whatsapp";
export const WELCOME_TEMPLATE = "momentum_offer_welcome";
const STATUS_RANK: Record<string, number> = { accepted: 0, sent: 1, delivered: 2, read: 3, failed: 4 };
const MAX_MEDIA_BYTES = 10 * 1024 * 1024;
const ALLOWED_MEDIA = new Set(["application/pdf", "image/jpeg", "image/png"]);
const STEP_ORDER = ["identity", "proof_of_address", "immigration_status", "qualifications", "english_evidence", "cv"] as const;
type AdmissionsStep = "confirm_identity" | typeof STEP_ORDER[number] | "ready_review";
type DocumentType = typeof STEP_ORDER[number] | "unclassified";

class ProviderError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function waDigits(phone: string) {
  const d = phone.replace(/\D/g, "");
  if (phone.trim().startsWith("+")) return d;
  if (d.startsWith("07")) return `44${d.slice(1)}`;
  if (d.startsWith("447")) return d;
  if (d.startsWith("7") && d.length === 10) return `44${d}`;
  return d;
}

function gatewayHeaders(json = false) {
  const lovable = process.env['LOVABLE_API_KEY'];
  const wa = process.env['WHATSAPP_API_KEY'];
  if (!lovable || !wa) throw new Error("WhatsApp is not configured");
  return { Authorization: `Bearer ${lovable}`, "X-Connection-Api-Key": wa, ...(json ? { "Content-Type": "application/json" } : {}) };
}

async function gatewayJson(path: string, init?: RequestInit) {
  const res = await fetch(`${GATEWAY_URL}${path}`, { ...init, headers: { ...gatewayHeaders(Boolean(init?.body)), ...Object.fromEntries(new Headers(init?.headers)) } });
  const text = await res.text();
  if (!res.ok) throw new ProviderError(res.status, `WhatsApp request failed (${res.status}): ${text.slice(0, 500)}`);
  return JSON.parse(text) as Record<string, unknown>;
}

async function gateway(path: string, body: unknown) {
  const payload = await gatewayJson(path, { method: "POST", body: JSON.stringify(body) });
  const id = (payload as { messages?: { id: string }[] }).messages?.[0]?.id;
  if (!id) throw new Error("WhatsApp send returned no message id");
  return id;
}

export async function getWelcomeTemplateStatus() {
  const payload = await gatewayJson("/message_templates", { method: "GET" }) as { data?: { name?: string; status?: string; language?: string }[] };
  const template = payload.data?.find((item) => item.name === WELCOME_TEMPLATE);
  return { status: template?.status ?? "MISSING", language: template?.language ?? null };
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
    const template = await getWelcomeTemplateStatus();
    if (template.status !== "APPROVED") {
      await supabaseAdmin.from("leads").update({ whatsapp_status: "awaiting_template" }).eq("id", lead.id);
      return;
    }
    const { data: claimed } = await supabaseAdmin.from("leads").update({ whatsapp_status: "sending" })
      .eq("id", lead.id).in("whatsapp_status", ["pending", "awaiting_template", "failed"]).select("id");
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
      const awaiting = /13200[01]|132015|does not exist in/.test(message);
      await supabaseAdmin.from("leads").update({ whatsapp_status: awaiting ? "awaiting_template" : "failed" }).eq("id", lead.id);
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

const STEP_REQUEST: Record<AdmissionsStep, string> = {
  confirm_identity: "Confirm the student's legal name, chosen course and campus, then ask them to reply if those details are correct.",
  identity: "Ask for a clear photo or PDF of their passport or national identity card.",
  proof_of_address: "Ask for a recent proof of address, such as a bank statement, council letter or utility bill.",
  immigration_status: "Ask for immigration evidence or a share code if relevant. Tell them they can say that it is not applicable.",
  qualifications: "Ask for certificates or transcripts from their previous qualifications.",
  english_evidence: "Ask for English-language evidence if they have it. Tell them they can say they do not have it yet.",
  cv: "Ask for their current CV.",
  ready_review: "Confirm the document pack has been collected and that an advisor will review it. Do not say it has been approved.",
};

function isOptOut(text: string) {
  return /^(stop|unsubscribe|cancel|parar|opreste|oprește|dezabonare|stoppen)$/i.test(text.trim());
}

function wantsAdvisor(text: string) {
  return /\b(advisor|adviser|agent|human|person|call me|complaint|speak to|consilier|persoană|om|agente|asesor)\b/i.test(text);
}

function canSkip(step: AdmissionsStep, text: string) {
  return (step === "immigration_status" || step === "english_evidence") && /\b(not applicable|n\/a|do not have|don't have|nu am|nu se aplic|no tengo|non ho|nie mam)\b/i.test(text);
}

function nextStep(step: AdmissionsStep): AdmissionsStep {
  if (step === "confirm_identity") return "identity";
  const index = STEP_ORDER.indexOf(step as typeof STEP_ORDER[number]);
  if (index < 0 || index === STEP_ORDER.length - 1) return "ready_review";
  return STEP_ORDER[index + 1] ?? "ready_review";
}

function documentTypeForStep(step: AdmissionsStep): DocumentType {
  return STEP_ORDER.includes(step as typeof STEP_ORDER[number]) ? step as DocumentType : "unclassified";
}

function safeFilename(filename: string | null, mime: string) {
  const fallback = mime === "application/pdf" ? "document.pdf" : mime === "image/png" ? "document.png" : "document.jpg";
  return (filename ?? fallback).replace(/[^a-zA-Z0-9._-]+/g, "-").slice(0, 120) || fallback;
}

async function readLimited(response: Response, expectedSize: number | null) {
  if (expectedSize != null && expectedSize > MAX_MEDIA_BYTES) throw new Error("File is larger than 10 MB");
  if (!response.body) throw new Error("WhatsApp returned an empty file");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    total += chunk.value.byteLength;
    if (total > MAX_MEDIA_BYTES) {
      await reader.cancel();
      throw new Error("File is larger than 10 MB");
    }
    chunks.push(chunk.value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}

async function processMedia(messageId: string) {
  const { data: row, error } = await supabaseAdmin.from("whatsapp_messages")
    .select("*, whatsapp_conversations(lead_id, admissions_step)").eq("id", messageId).single();
  if (error || !row || !row.media_id || row.media_status === "stored") return;
  const conv = row.whatsapp_conversations as { lead_id: string | null; admissions_step: AdmissionsStep } | null;
  if (!conv?.lead_id) {
    await supabaseAdmin.from("whatsapp_messages").update({ media_status: "needs_advisor", media_error: "No application is linked to this number" }).eq("id", row.id);
    return;
  }
  const attempt = row.media_attempts + 1;
  await supabaseAdmin.from("whatsapp_messages").update({ media_status: "downloading", media_attempts: attempt, media_error: null }).eq("id", row.id);
  try {
    const metadata = await gatewayJson(`/media/${encodeURIComponent(row.media_id)}`, { method: "GET" }) as { url?: string; mime_type?: string; sha256?: string; file_size?: number };
    const mime = metadata.mime_type ?? row.media_mime_type ?? "";
    if (!metadata.url) throw new Error("WhatsApp did not return a media URL");
    if (!ALLOWED_MEDIA.has(mime)) throw new Error("Only PDF, JPEG and PNG documents are accepted");
    const download = await fetch(`${GATEWAY_URL}/media_download`, { method: "GET", headers: { ...gatewayHeaders(), "X-WhatsApp-Media-URL": metadata.url } });
    if (!download.ok) throw new ProviderError(download.status, `WhatsApp media download failed (${download.status})`);
    const bytes = await readLimited(download, metadata.file_size ?? null);
    const filename = safeFilename(row.media_filename, mime);
    const docType = documentTypeForStep(conv.admissions_step);
    const storagePath = `${conv.lead_id}/${docType}/${Date.now()}-${row.id}-${filename}`;
    const { error: uploadError } = await supabaseAdmin.storage.from("admissions-documents").upload(storagePath, bytes, { contentType: mime, upsert: false });
    if (uploadError) throw uploadError;
    const sha256 = metadata.sha256 ?? createHash("sha256").update(bytes).digest("hex");
    const { error: insertError } = await supabaseAdmin.from("admission_documents").insert({
      lead_id: conv.lead_id, whatsapp_message_id: row.id, document_type: docType,
      original_filename: filename, mime_type: mime, file_size: bytes.byteLength,
      storage_path: storagePath, status: "received",
    });
    if (insertError) {
      await supabaseAdmin.storage.from("admissions-documents").remove([storagePath]);
      throw insertError;
    }
    const step = nextStep(conv.admissions_step);
    await supabaseAdmin.from("whatsapp_messages").update({ media_status: "stored", media_mime_type: mime, media_size: bytes.byteLength, media_sha256: sha256, media_error: null }).eq("id", row.id);
    await supabaseAdmin.from("whatsapp_conversations").update({ admissions_step: step, ...(step === "ready_review" ? { status: "queued", queued_at: new Date().toISOString(), summary: "Admissions document pack collected and ready for advisor review" } : {}), updated_at: new Date().toISOString() }).eq("id", row.conversation_id);
  } catch (caught) {
    const message = caught instanceof Error ? caught.message : String(caught);
    const retryable = caught instanceof ProviderError && (caught.status === 429 || caught.status >= 500);
    await supabaseAdmin.from("whatsapp_messages").update({
      media_status: retryable && attempt < 4 ? "pending" : "failed",
      media_next_attempt_at: retryable && attempt < 4 ? new Date(Date.now() + attempt * 60_000).toISOString() : null,
      media_error: message.slice(0, 1000),
    }).eq("id", row.id);
    throw caught;
  }
}

async function generateReply(conversationId: string) {
  const { data: conv } = await supabaseAdmin.from("whatsapp_conversations").select("*, leads(full_name, selected_course, study_route, nearest_campus, ref_code)").eq("id", conversationId).single();
  if (!conv || conv.status !== "bot") return null;
  const { data: history } = await supabaseAdmin.from("whatsapp_messages").select("direction, body").eq("conversation_id", conversationId).order("created_at").limit(60);
  const lead = conv.leads as { full_name: string; selected_course: string | null; study_route: string | null; nearest_campus: string | null; ref_code: string } | null;
  const messages: ModelMessage[] = (history ?? []).filter((m) => m.body).map((m) => ({ role: m.direction === "in" ? "user" : "assistant", content: m.body }));

  const step = (conv.admissions_step || "confirm_identity") as AdmissionsStep;
  const system = `You are the Momentum One WhatsApp admissions assistant. Momentum One is a UK student recruitment company that helps students apply to university degree courses taught at local campuses.
Automatically detect the language of the student's latest message and answer in that language. Write at most 3 short paragraphs, plain text, no markdown headings, never use em dashes.
Your job is to collect the admissions information and documents one item at a time. You organise files only. Never judge whether a document is genuine, sufficient or valid. Never confirm eligibility or admission. An advisor reviews everything.
${lead ? `Student: ${lead.full_name}. Chosen course: ${lead.selected_course ?? "not chosen"} (${lead.study_route ?? "route not chosen"}) at ${lead.nearest_campus ?? "unknown campus"}. Reference ${lead.ref_code}.` : "This number is not linked to an application yet. Invite them to apply on the Momentum One website."}

Current collection step: ${step}.
Required next action: ${STEP_REQUEST[step]}

Facts you may use. Never invent dates, fees, phone numbers, emails or addresses. Say "to be confirmed by an advisor" when unknown.
Courses and study patterns by campus:
${catalogueText()}
How to apply: 1) choose a course, 2) advisor call, 3) document check, 4) online pre-task, 5) PFF Day assessment at the campus, then enrolment.
Documents usually needed: proof of identity, share code or immigration status if relevant, proof of address, Duolingo English test if required, CV, previous qualifications.
Pre-task: 4 questions, about 150 words each, under 20% similarity, 2 attempts.
The personalised offer is not a confirmed university admission offer. Eligibility is confirmed after document review and assessment.
Student finance may be available for eligible students; an advisor confirms eligibility.

If the student asks a question that can be answered from these facts, answer it briefly, then repeat the required next action. If the file they sent was accepted, acknowledge it without saying it was reviewed or approved.
Return exactly two lines:
LANGUAGE: a short BCP-47 language code
REPLY: the message to send`;

  const lovable = process.env['LOVABLE_API_KEY'];
  if (!lovable) throw new Error("LOVABLE_API_KEY is not configured");
  const runIdFetch = createAiRunIdFetch();
  const provider = createOpenAI({
    baseURL: "https://ai.gateway.lovable.dev/v1",
    apiKey: lovable,
    headers: { "Lovable-API-Key": lovable, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    fetch: runIdFetch.fetch,
  });
  const result = streamText({
    model: provider.responses("openai/gpt-6-astra"),
    system,
    messages,
    providerOptions: { openai: { store: false, forceReasoning: true, reasoningEffort: "low", reasoningSummary: "auto", include: ["reasoning.encrypted_content"] } },
  });
  const raw = (await result.text).trim();
  const language = /^LANGUAGE:\s*([^\n]+)/im.exec(raw)?.[1]?.trim().slice(0, 20) || null;
  const text = /^REPLY:\s*([\s\S]+)/im.exec(raw)?.[1]?.trim() || raw;
  if (language) await supabaseAdmin.from("whatsapp_conversations").update({ detected_language: language }).eq("id", conversationId);
  return text || null;
}

/** Claims and answers one pending inbound message. Safe to call repeatedly. */
async function answerInbound(messageRowId: string) {
  const now = new Date().toISOString();
  const { data: claimed } = await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "sending", reply_started_at: now, reply_attempts: 1 })
    .eq("id", messageRowId).eq("reply_status", "pending").lte("reply_next_attempt_at", now).select("conversation_id, body, media_status, reply_attempts").maybeSingle();
  if (!claimed) return;
  try {
    const attempts = claimed.reply_attempts;
    const { data: conv } = await supabaseAdmin.from("whatsapp_conversations").select("wa_phone, status, admissions_step, opted_out_at").eq("id", claimed.conversation_id).single();
    if (!conv || conv.status !== "bot") { await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "skipped" }).eq("id", messageRowId); return; }
    if (conv.opted_out_at) { await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "opted_out" }).eq("id", messageRowId); return; }
    if (isOptOut(claimed.body)) {
      await supabaseAdmin.from("whatsapp_conversations").update({ status: "closed", opted_out_at: now, updated_at: now }).eq("id", claimed.conversation_id);
      const id = await gateway("/messages", { messaging_product: "whatsapp", to: conv.wa_phone, type: "text", text: { body: "You will not receive any more WhatsApp messages from Momentum One. Your application record is still safely stored." } });
      await supabaseAdmin.from("whatsapp_messages").insert({ conversation_id: claimed.conversation_id, direction: "bot", body: "You will not receive any more WhatsApp messages from Momentum One. Your application record is still safely stored.", wa_message_id: id, status: "accepted" });
      await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "sent" }).eq("id", messageRowId);
      return;
    }
    if (wantsAdvisor(claimed.body)) {
      await supabaseAdmin.from("whatsapp_conversations").update({ status: "queued", queued_at: now, summary: "Student asked to speak with an advisor", updated_at: now }).eq("id", claimed.conversation_id);
      const body = "Of course. An advisor will reply to you here shortly.";
      const id = await gateway("/messages", { messaging_product: "whatsapp", to: conv.wa_phone, type: "text", text: { body } });
      await supabaseAdmin.from("whatsapp_messages").insert({ conversation_id: claimed.conversation_id, direction: "bot", body, wa_message_id: id, status: "accepted" });
      await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "sent" }).eq("id", messageRowId);
      return;
    }
    if (claimed.media_status && claimed.media_status !== "stored") await processMedia(messageRowId);
    if (!claimed.media_status && (conv.admissions_step === "confirm_identity" || canSkip(conv.admissions_step as AdmissionsStep, claimed.body))) {
      await supabaseAdmin.from("whatsapp_conversations").update({ admissions_step: nextStep(conv.admissions_step as AdmissionsStep), updated_at: now }).eq("id", claimed.conversation_id);
    }
    const reply = await generateReply(claimed.conversation_id);
    if (!reply) { await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "skipped" }).eq("id", messageRowId); return; }
    const id = await gateway("/messages", { messaging_product: "whatsapp", to: conv.wa_phone, type: "text", text: { body: reply.slice(0, 4000) } });
    await supabaseAdmin.from("whatsapp_messages").insert({ conversation_id: claimed.conversation_id, direction: "bot", body: reply, wa_message_id: id, status: "accepted" });
    await supabaseAdmin.from("whatsapp_conversations").update({ last_outbound_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", claimed.conversation_id);
    await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "sent" }).eq("id", messageRowId);
  } catch (error) {
    console.error("WhatsApp bot reply failed", error);
    const current = await supabaseAdmin.from("whatsapp_messages").select("reply_attempts").eq("id", messageRowId).single();
    const attempts = current.data?.reply_attempts ?? 1;
    const retryable = error instanceof ProviderError && (error.status === 429 || error.status >= 500);
    await supabaseAdmin.from("whatsapp_messages").update({
      reply_status: retryable && attempts < 4 ? "pending" : "failed",
      reply_next_attempt_at: retryable && attempts < 4 ? new Date(Date.now() + attempts * 60_000).toISOString() : null,
      error: String(error).slice(0, 1000),
    }).eq("id", messageRowId);
  }
}

type WaValue = {
  messages?: { id: string; from: string; type: string; text?: { body: string }; button?: { text: string }; interactive?: { button_reply?: { title: string }; list_reply?: { title: string } }; document?: { id: string; mime_type?: string; sha256?: string; filename?: string; caption?: string }; image?: { id: string; mime_type?: string; sha256?: string; caption?: string } }[];
  statuses?: { id: string; status: string; errors?: { title?: string; message?: string }[] }[];
  message_echoes?: { id: string; to: string; text?: { body: string }; type: string }[];
  event?: string;
  message_template_name?: string;
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
        const media = m.document ?? m.image;
        const body = m.text?.body ?? m.button?.text ?? m.interactive?.button_reply?.title ?? m.interactive?.list_reply?.title ?? media?.caption ?? `[${m.type} received]`;
        const mediaFields = media ? {
          media_id: media.id,
          media_type: m.type,
          media_mime_type: media.mime_type ?? null,
          media_filename: m.document?.filename ?? null,
          media_sha256: media.sha256 ?? null,
          media_status: "pending",
          media_next_attempt_at: new Date().toISOString(),
        } : {};
        const { data: ins, error: e } = await supabaseAdmin.from("whatsapp_messages")
          .upsert({ conversation_id: conv.id, direction: "in", body, wa_message_id: m.id, status: "received", reply_status: conv.status === "bot" ? "pending" : "skipped", reply_next_attempt_at: new Date().toISOString(), ...mediaFields }, { onConflict: "wa_message_id", ignoreDuplicates: true })
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
    } else if (row.event === "whatsapp.template_status") {
      if (value.message_template_name === WELCOME_TEMPLATE && value.event === "APPROVED") {
        await supabaseAdmin.from("leads").update({ whatsapp_status: "pending" }).eq("whatsapp_status", "awaiting_template");
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
  const { data: stale } = await supabaseAdmin.from("whatsapp_messages").select("id, reply_attempts")
    .eq("reply_status", "sending").lt("reply_started_at", new Date(Date.now() - 5 * 60_000).toISOString()).limit(3);
  for (const m of stale ?? []) await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "pending", reply_next_attempt_at: new Date().toISOString() }).eq("id", m.id).eq("reply_status", "sending");
  const now = new Date().toISOString();
  const { data: pending } = await supabaseAdmin.from("whatsapp_messages").select("id").eq("reply_status", "pending").lte("reply_next_attempt_at", now).order("created_at").limit(3);
  return (pending ?? []).map((p) => p.id);
}

export async function processPendingWork(preferredIds: string[] = []) {
  const recovered = await recoverPending();
  for (const id of Array.from(new Set([...preferredIds, ...recovered])).slice(0, 5)) await answerInbound(id);
}

export { answerInbound };
