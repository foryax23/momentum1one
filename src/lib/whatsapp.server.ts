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
type AdmissionsStep = "welcome" | "details" | "details_confirm" | "docs_consent" | typeof STEP_ORDER[number] | "final_reminder" | "ready_review";
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
      await supabaseAdmin.from("whatsapp_conversations").update({ bot_enabled: true, activated_via: "welcome", lead_id: lead.id, updated_at: new Date().toISOString() }).eq("id", conv.id);
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

type Profile = Partial<Record<typeof PROFILE_FIELDS[number], string>>;
type Reminders = { skipped?: string[]; reminded?: boolean };

const PROFILE_FIELDS = ["date_of_birth", "home_address", "postcode", "nationality", "immigration_status", "highest_qualification", "english_first_language"] as const;
const PROFILE_LABEL: Record<typeof PROFILE_FIELDS[number], string> = {
  date_of_birth: "date of birth",
  home_address: "full home address (house number, street, town)",
  postcode: "postcode",
  nationality: "nationality",
  immigration_status: "current UK immigration status (British or Irish citizen, settled or pre-settled status, visa, or other)",
  highest_qualification: "highest qualification so far and where it was taken",
  english_first_language: "whether English is their first language (yes or no)",
};
const DOC_LABEL: Record<typeof STEP_ORDER[number], string> = {
  identity: "passport or national ID card (clear photo or PDF of the photo page). We need it to confirm identity for the university",
  proof_of_address: "proof of address from the last 3 months, such as a bank statement, council tax letter or utility bill",
  immigration_status: "share code or immigration document, so the university can confirm study and funding rights",
  qualifications: "certificates or transcripts from previous qualifications",
  english_evidence: "English language evidence, such as a test result or certificate",
  cv: "current CV, even a simple one is fine",
};

function normaliseStep(step: string | null): AdmissionsStep {
  if (!step || step === "confirm_identity") return "welcome";
  return step as AdmissionsStep;
}

function missingFields(profile: Profile) {
  return PROFILE_FIELDS.filter((f) => !profile[f]?.trim());
}

function neededDocs(profile: Profile) {
  return STEP_ORDER.filter((d) => {
    if (d === "immigration_status" && /british|irish|uk citizen|cetățean britanic/i.test(profile.immigration_status ?? "")) return false;
    if (d === "english_evidence" && /^(yes|y|da|sí|si|tak|oui|ja)\b/i.test(profile.english_first_language ?? "")) return false;
    return true;
  });
}

function stepAfter(step: AdmissionsStep, profile: Profile, reminders: Reminders): AdmissionsStep {
  if (step === "welcome") return missingFields(profile).length ? "details" : "details_confirm";
  if (step === "details") return missingFields(profile).length ? "details" : "details_confirm";
  const docs = neededDocs(profile);
  let index = -1;
  if (step === "details_confirm") return "docs_consent";
  if (step !== "docs_consent") {
    if (step === "final_reminder" || step === "ready_review") return "ready_review";
    index = STEP_ORDER.indexOf(step as typeof STEP_ORDER[number]);
  }
  const next = docs.find((d) => STEP_ORDER.indexOf(d) > index);
  if (next) return next;
  return reminders.skipped?.length && !reminders.reminded ? "final_reminder" : "ready_review";
}

function stepInstruction(step: AdmissionsStep, profile: Profile, reminders: Reminders) {
  const docs = neededDocs(profile);
  const done = STEP_ORDER.includes(step as typeof STEP_ORDER[number]) ? docs.indexOf(step as typeof STEP_ORDER[number]) : 0;
  switch (step) {
    case "welcome": return "Greet the student warmly by first name, confirm their course and campus, explain in one sentence that you will help get their application ready (a few quick questions, then a few documents, about 10 minutes, and they can pause any time), and ask if now is a good time. Do not ask for documents yet.";
    case "details": {
      const missing = missingFields(profile);
      return `Collect personal details conversationally, ONE question per message. Still missing: ${missing.map((f) => PROFILE_LABEL[f]).join("; ")}. Ask for the first missing item only (you may combine address and postcode). Thank them briefly for what they just shared.`;
    }
    case "details_confirm": return `Show a short friendly recap of the details below and ask them to reply "yes" if correct or tell you what to change. Details: ${PROFILE_FIELDS.map((f) => `${PROFILE_LABEL[f].split(" (")[0]}: ${profile[f] ?? "-"}`).join("; ")}.`;
    case "docs_consent": return "Before any document: in one friendly sentence explain the university admissions team needs a few documents to process the application, and that files are stored privately and only seen by Momentum One advisors. Then ask whether they would like to send them here in this chat, or prefer an advisor to call them first. Do not ask for a document yet. Intent: 'confirm' if they agree to send here, 'call_first' if they want a call first.";
    case "final_reminder": return `Gently mention the items they skipped (${(reminders.skipped ?? []).map((d) => DOC_LABEL[d as typeof STEP_ORDER[number]]?.split(",")[0] ?? d).join(", ")}). Say they can send them now, or later in this chat, no pressure. This is the only reminder.`;
    case "ready_review": return "Thank them sincerely, give a one-line recap that their details and documents are with the team, and say an advisor will review everything and contact them about next steps. Do not say anything was approved.";
    default: return `Now collecting documents (document ${done + 1} of ${docs.length}). Ask kindly for their ${DOC_LABEL[step as typeof STEP_ORDER[number]]}. Say a photo or PDF is fine. Mention they can say "later" if they do not have it to hand.`;
  }
}

function isOptOut(text: string) {
  return /^(stop|unsubscribe|cancel|parar|opreste|oprește|dezabonare|stoppen)$/i.test(text.trim());
}

function wantsAdvisor(text: string) {
  return /\b(advisor|adviser|agent|human|real person|call me|speak to|consilier|persoană|agente|asesor)\b/i.test(text);
}

/** Fast server-side red flags; the AI adds a second, contextual check. */
function suspiciousReason(text: string): string | null {
  if (/https?:\/\/|www\.|bit\.ly|t\.me\//i.test(text)) return "Sent a link";
  if (/\b(ignore (all|previous|your) (instructions|rules)|system prompt|your instructions|jailbreak|act as)\b/i.test(text)) return "Tried to change the bot's instructions";
  if (/\b(guarantee(d)? (visa|admission|place)|pay (you|cash)|bribe|money to get|buy (a )?(degree|place|offer)|fake (document|certificate|passport))\b/i.test(text)) return "Payment or guarantee request";
  if (/\b(card number|cvv|bank details|password|pin code|iban)\b/i.test(text)) return "Shared or asked for financial or login details";
  if (/\b(complaint|lawyer|solicitor|sue|police|scam|fraud|suicid|self[- ]harm|abuse)\b/i.test(text)) return "Complaint or sensitive topic";
  if (/\b(fuck|shit|bitch|idiot|stupid bot)\b/i.test(text)) return "Abusive language";
  return null;
}

const HOLD_MESSAGES = [
  "Thanks, give me a moment. I'm passing you to one of our advisors, who will reply here shortly.",
  "Hold on a second, I'm bringing in one of our advisors to help you with this. They'll reply here soon.",
  "Thanks for your patience, one of our advisors will pick this up and reply to you here shortly.",
];

async function flagAndHold(conversationId: string, to: string, reason: string) {
  const now = new Date().toISOString();
  await supabaseAdmin.from("whatsapp_conversations").update({ status: "queued", queued_at: now, flagged: true, flag_reason: reason.slice(0, 200), summary: `Needs attention: ${reason}`.slice(0, 300), updated_at: now }).eq("id", conversationId);
  await sendText(conversationId, to, HOLD_MESSAGES[Math.floor(Math.random() * HOLD_MESSAGES.length)]!);
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

async function setStep(conversationId: string, step: AdmissionsStep, extra: Record<string, unknown> = {}) {
  const now = new Date().toISOString();
  await supabaseAdmin.from("whatsapp_conversations").update({
    admissions_step: step,
    ...(step === "ready_review" ? { status: "queued", queued_at: now, summary: "Admissions details and documents collected, ready for advisor review" } : {}),
    ...extra, updated_at: now,
  } as never).eq("id", conversationId);
}

async function processMedia(messageId: string) {
  const { data: row, error } = await supabaseAdmin.from("whatsapp_messages")
    .select("*, whatsapp_conversations(lead_id, admissions_step, profile, reminders)").eq("id", messageId).single();
  if (error || !row || !row.media_id || row.media_status === "stored") return;
  const conv = row.whatsapp_conversations as { lead_id: string | null; admissions_step: string; profile: Profile; reminders: Reminders } | null;
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
    const step = normaliseStep(conv.admissions_step);
    const docType = documentTypeForStep(step);
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
    await supabaseAdmin.from("whatsapp_messages").update({ media_status: "stored", media_mime_type: mime, media_size: bytes.byteLength, media_sha256: sha256, media_error: null }).eq("id", row.id);
    if (docType !== "unclassified") {
      const reminders = conv.reminders ?? {};
      const skipped = (reminders.skipped ?? []).filter((d) => d !== docType);
      await setStep(row.conversation_id, stepAfter(step, conv.profile ?? {}, { ...reminders, skipped }), { reminders: { ...reminders, skipped } });
    } else if (step === "final_reminder") {
      await setStep(row.conversation_id, "ready_review");
    }
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

type AiResult = { language: string | null; intent: string; profile: Profile; reply: string };

async function runAssistant(conversationId: string, mediaNote: string | null): Promise<AiResult | null> {
  const { data: conv } = await supabaseAdmin.from("whatsapp_conversations").select("*, leads(full_name, selected_course, study_route, nearest_campus, ref_code)").eq("id", conversationId).single();
  if (!conv || conv.status !== "bot" || !conv.bot_enabled) return null;
  const { data: history } = await supabaseAdmin.from("whatsapp_messages").select("direction, body").eq("conversation_id", conversationId).order("created_at", { ascending: false }).limit(40);
  const lead = conv.leads as { full_name: string; selected_course: string | null; study_route: string | null; nearest_campus: string | null; ref_code: string } | null;
  const messages: ModelMessage[] = (history ?? []).reverse().filter((m) => m.body).map((m) => ({ role: m.direction === "in" ? "user" : "assistant", content: m.body }));
  const profile = (conv.profile ?? {}) as Profile;
  const reminders = (conv.reminders ?? {}) as Reminders;
  const step = normaliseStep(conv.admissions_step);
  const nextIfSkipped = STEP_ORDER.includes(step as typeof STEP_ORDER[number]) ? stepAfter(step, profile, reminders) : null;

  const system = `You are Maya, the friendly admissions assistant for Momentum One, a UK student recruitment company that helps adults apply to university degrees taught at local campuses. You chat on WhatsApp like a warm, patient human advisor.
Style: reply in the language of the student's latest message. Keep it short: 1 to 3 short sentences, occasionally a short line break. Plain text, no markdown, no bullet lists, at most one emoji, never use em dashes. Never sound like a form or repeat the same request twice in a row. Thank them for each thing they share. If they seem busy or unsure, reassure them they can continue later.
Rules: you collect information and files only. Never judge whether a document is genuine or enough, never confirm eligibility, funding or admission. An advisor reviews everything. Never invent dates, fees, phone numbers, emails or addresses; say an advisor will confirm.
${lead ? `Student: ${lead.full_name}. Course: ${lead.selected_course ?? "not chosen"} (${lead.study_route ?? "route not chosen"}) at ${lead.nearest_campus ?? "unknown campus"}. Reference ${lead.ref_code}.` : ""}
Details collected so far: ${JSON.stringify(profile)}
${mediaNote ? `System note about the file they just sent: ${mediaNote}` : ""}

CURRENT TASK: ${stepInstruction(step, profile, reminders)}
If the student asks a question, answer it first from the facts below, then gently continue the current task.
${nextIfSkipped ? `If they say they do not have this document now, want to do it later, or it does not apply, accept kindly and move on: ${nextIfSkipped === "final_reminder" || nextIfSkipped === "ready_review" ? "tell them that was the last document" : `ask for their ${DOC_LABEL[nextIfSkipped as typeof STEP_ORDER[number]]}`}.` : ""}
${step === "details_confirm" ? `If they confirm, thank them and ask for the first document: ${DOC_LABEL[neededDocs(profile)[0] ?? "cv"]}. If they correct something, record it and recap again.` : ""}

Facts:
${catalogueText()}
How to apply: choose a course, advisor call, document check, online pre-task (4 questions, about 150 words each, under 20% similarity, 2 attempts), PFF Day assessment at the campus, then enrolment.
The personalised offer is not a confirmed university admission offer. Student finance may be available for eligible students; an advisor confirms eligibility.

Return ONLY a JSON object, no other text:
{"language":"BCP-47 code","intent":"answer|question|confirm|correction|skip|later|smalltalk","profile":{only fields the student clearly gave in their latest message, using keys ${PROFILE_FIELDS.join(", ")}, string values},"reply":"the WhatsApp message"}`;

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
  let parsed: Partial<AiResult> = {};
  try { parsed = JSON.parse(raw.slice(raw.indexOf("{"), raw.lastIndexOf("}") + 1)); } catch { parsed = { reply: raw }; }
  const cleanProfile: Profile = {};
  for (const f of PROFILE_FIELDS) {
    const v = (parsed.profile as Record<string, unknown> | undefined)?.[f];
    if (typeof v === "string" && v.trim()) cleanProfile[f] = v.trim().slice(0, 300);
  }
  const reply = typeof parsed.reply === "string" ? parsed.reply.trim() : "";
  if (!reply) return null;
  return { language: typeof parsed.language === "string" ? parsed.language.slice(0, 20) : null, intent: String(parsed.intent ?? "answer"), profile: cleanProfile, reply };
}

/** Applies the AI's extracted details and intent to the conversation state. Server decides the step. */
async function applyResult(conversationId: string, result: AiResult, hadMedia: boolean) {
  const { data: conv } = await supabaseAdmin.from("whatsapp_conversations").select("admissions_step, profile, reminders").eq("id", conversationId).single();
  if (!conv) return;
  const profile = { ...(conv.profile as Profile ?? {}), ...result.profile };
  const reminders = { ...(conv.reminders as Reminders ?? {}) };
  const step = normaliseStep(conv.admissions_step);
  let next = step;
  if (step === "welcome") next = stepAfter("welcome", profile, reminders);
  else if (step === "details") next = stepAfter("details", profile, reminders);
  else if (step === "details_confirm" && result.intent === "confirm") next = stepAfter("details_confirm", profile, reminders);
  else if (STEP_ORDER.includes(step as typeof STEP_ORDER[number]) && !hadMedia && (result.intent === "skip" || result.intent === "later")) {
    if (result.intent === "later") reminders.skipped = Array.from(new Set([...(reminders.skipped ?? []), step]));
    next = stepAfter(step, profile, reminders);
  } else if (step === "final_reminder") { reminders.reminded = true; next = "ready_review"; }
  if (step === "final_reminder" && result.intent !== "smalltalk") reminders.reminded = true;
  await setStep(conversationId, next, { profile, reminders, ...(result.language ? { detected_language: result.language } : {}) });
}

async function sendText(conversationId: string, to: string, body: string) {
  const id = await gateway("/messages", { messaging_product: "whatsapp", to, type: "text", text: { body: body.slice(0, 4000) } });
  await supabaseAdmin.from("whatsapp_messages").insert({ conversation_id: conversationId, direction: "bot", body, wa_message_id: id, status: "accepted" });
  await supabaseAdmin.from("whatsapp_conversations").update({ last_outbound_at: new Date().toISOString() }).eq("id", conversationId);
}

/** Claims and answers one pending inbound message. Safe to call repeatedly. */
async function answerInbound(messageRowId: string) {
  const now = new Date().toISOString();
  const { data: claimed } = await supabaseAdmin.from("whatsapp_messages").update({ reply_status: "sending", reply_started_at: now, reply_attempts: 1 })
    .eq("id", messageRowId).eq("reply_status", "pending").lte("reply_next_attempt_at", now).select("conversation_id, body, media_status, reply_attempts").maybeSingle();
  if (!claimed) return;
  const markReply = (reply_status: string) => supabaseAdmin.from("whatsapp_messages").update({ reply_status }).eq("id", messageRowId);
  try {
    const { data: conv } = await supabaseAdmin.from("whatsapp_conversations").select("wa_phone, status, bot_enabled, opted_out_at").eq("id", claimed.conversation_id).single();
    if (!conv || conv.status !== "bot" || !conv.bot_enabled) { await markReply("skipped"); return; }
    if (conv.opted_out_at) { await markReply("opted_out"); return; }
    if (isOptOut(claimed.body)) {
      await supabaseAdmin.from("whatsapp_conversations").update({ status: "closed", opted_out_at: now, updated_at: now }).eq("id", claimed.conversation_id);
      await sendText(claimed.conversation_id, conv.wa_phone, "No problem, you will not receive any more WhatsApp messages from Momentum One. Your application is still safely stored if you change your mind.");
      await markReply("sent");
      return;
    }
    if (wantsAdvisor(claimed.body)) {
      await supabaseAdmin.from("whatsapp_conversations").update({ status: "queued", queued_at: now, summary: "Student asked to speak with an advisor", updated_at: now }).eq("id", claimed.conversation_id);
      await sendText(claimed.conversation_id, conv.wa_phone, "Of course. One of our advisors will reply to you here shortly.");
      await markReply("sent");
      return;
    }
    let mediaNote: string | null = null;
    const hadMedia = Boolean(claimed.media_status);
    if (hadMedia && claimed.media_status !== "stored") {
      try { await processMedia(messageRowId); mediaNote = "The file was received and saved for the advisor. Thank them; do not say it was checked or approved."; }
      catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (e instanceof ProviderError && (e.status === 429 || e.status >= 500)) throw e;
        mediaNote = /10 MB|PDF, JPEG/.test(msg) ? `The file could not be saved: ${msg}. Kindly ask them to resend it as a PDF, JPG or PNG under 10 MB.` : "The file could not be saved. Kindly ask them to try sending it again.";
      }
    } else if (hadMedia) mediaNote = "The file was received and saved for the advisor.";
    const result = await runAssistant(claimed.conversation_id, mediaNote);
    if (!result) { await markReply("skipped"); return; }
    await applyResult(claimed.conversation_id, result, hadMedia);
    await sendText(claimed.conversation_id, conv.wa_phone, result.reply);
    await markReply("sent");
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

/** Activates the bot when the student quotes a real reference code. */
async function activateByRefCode(conv: { id: string; bot_enabled: boolean; lead_id: string | null }, body: string) {
  if (conv.bot_enabled) return conv.bot_enabled;
  const code = /MO-\d{4}-\d{5}/i.exec(body)?.[0]?.toUpperCase();
  if (!code) return false;
  const { data: lead } = await supabaseAdmin.from("leads").select("id").eq("ref_code", code).maybeSingle();
  if (!lead) return false;
  await supabaseAdmin.from("whatsapp_conversations").update({ bot_enabled: true, activated_via: "ref_code", lead_id: lead.id, status: "bot", updated_at: new Date().toISOString() }).eq("id", conv.id);
  return true;
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
        const enabled = await activateByRefCode(conv, body);
        const botStatus = enabled && (conv.status === "bot" || (!conv.bot_enabled && conv.status !== "agent"));
        const { data: ins, error: e } = await supabaseAdmin.from("whatsapp_messages")
          .upsert({ conversation_id: conv.id, direction: "in", body, wa_message_id: m.id, status: "received", reply_status: botStatus ? "pending" : "skipped", reply_next_attempt_at: new Date().toISOString(), ...mediaFields }, { onConflict: "wa_message_id", ignoreDuplicates: true })
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
