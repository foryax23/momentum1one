import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const resendWelcome = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: lead, error } = await supabaseAdmin.from("leads")
      .update({ whatsapp_status: "pending" }).eq("id", data.leadId).neq("whatsapp_status", "sending")
      .select("id, full_name, phone, selected_course, nearest_campus, ref_code, whatsapp").single();
    if (error || !lead) throw new Error("Could not resend right now.");
    // sendWelcome refuses both cases silently; say why here so the admin is not left guessing.
    if (!lead.whatsapp) throw new Error("This applicant did not agree to WhatsApp contact. Use phone or email instead.");
    const { sendWelcome, hasOptedOut } = await import("./whatsapp.server");
    const optedOut = await hasOptedOut(lead.phone).catch(() => null);
    if (optedOut === null) throw new Error("Could not resend right now.");
    if (optedOut) throw new Error("This number has opted out of WhatsApp messages. Use phone or email instead.");
    await sendWelcome(lead);
    const { data: after } = await supabaseAdmin.from("leads").select("whatsapp_status").eq("id", lead.id).single();
    return { status: after?.whatsapp_status ?? "unknown" };
  });

const adminOnly = async (context: { supabase: { rpc: (name: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: boolean | null }> }; userId: string }) => {
  const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
};

export const getWhatsAppTemplateHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adminOnly(context);
    const { getWelcomeTemplateStatus } = await import("./whatsapp.server");
    return getWelcomeTemplateStatus();
  });

export const getAdmissionPack = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await adminOnly(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: conversation } = await supabaseAdmin.from("whatsapp_conversations")
      .select("id, detected_language, admissions_step, status, queued_at, last_inbound_at, bot_enabled, activated_via, profile")
      .eq("lead_id", data.leadId).maybeSingle();
    const { data: documents, error } = await supabaseAdmin.from("admission_documents")
      .select("id, document_type, original_filename, mime_type, file_size, status, replacement_reason, received_at, reviewed_at")
      .eq("lead_id", data.leadId).order("received_at", { ascending: false });
    if (error) throw new Error("Could not load the admissions pack.");
    return { conversation, documents: documents ?? [] };
  });

export const getAdmissionDocumentUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ documentId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await adminOnly(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: document, error } = await supabaseAdmin.from("admission_documents").select("storage_path").eq("id", data.documentId).single();
    if (error || !document) throw new Error("Document not found.");
    const { data: signed, error: signedError } = await supabaseAdmin.storage.from("admissions-documents").createSignedUrl(document.storage_path, 60);
    if (signedError || !signed) throw new Error("Could not open the document.");
    return { url: signed.signedUrl };
  });

export const updateAdmissionDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ documentId: z.string().uuid(), action: z.enum(["reviewed", "replacement_requested"]), reason: z.string().trim().max(500).nullable() }).parse(data))
  .handler(async ({ data, context }) => {
    await adminOnly(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch = data.action === "reviewed"
      ? { status: "reviewed", reviewed_at: new Date().toISOString(), reviewed_by: context.userId, replacement_reason: null }
      : { status: "replacement_requested", reviewed_at: null, reviewed_by: null, replacement_reason: data.reason || "Please send a clearer replacement." };
    const { error } = await supabaseAdmin.from("admission_documents").update(patch).eq("id", data.documentId);
    if (error) throw new Error("Could not update the document.");
    return { ok: true };
  });

export const queueAdmissionsReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ leadId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    await adminOnly(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const now = new Date().toISOString();
    const { error } = await supabaseAdmin.from("whatsapp_conversations").update({ status: "queued", admissions_step: "ready_review", queued_at: now, summary: "Admissions pack is ready for advisor review", updated_at: now }).eq("lead_id", data.leadId);
    if (error) throw new Error("Could not queue this application.");
    return { ok: true };
  });

export const sendAllWaitingWelcomes = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adminOnly(context);
    const { sendWaitingWelcomes } = await import("./whatsapp.server");
    return sendWaitingWelcomes();
  });

export const getReplyHealth = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await adminOnly(context);
    const { replyHealth } = await import("./whatsapp.server");
    return replyHealth();
  });

export const retryFailedReply = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { messageId: string }) => ({ messageId: String(data.messageId).slice(0, 64) }))
  .handler(async ({ data, context }) => {
    await adminOnly(context);
    const { retryReply } = await import("./whatsapp.server");
    await retryReply(data.messageId);
    return { ok: true };
  });
