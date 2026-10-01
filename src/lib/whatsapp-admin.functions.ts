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
      .select("id, full_name, phone, selected_course, nearest_campus, ref_code").single();
    if (error || !lead) throw new Error("Could not resend right now.");
    const { sendWelcome } = await import("./whatsapp.server");
    await sendWelcome(lead);
    const { data: after } = await supabaseAdmin.from("leads").select("whatsapp_status").eq("id", lead.id).single();
    return { status: after?.whatsapp_status ?? "unknown" };
  });
