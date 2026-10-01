import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleSchema = z.enum(["admin", "advisor", "user"]);

async function requireAdmin(context: { supabase: { rpc: (name: "has_role", args: { _user_id: string; _role: "admin" }) => PromiseLike<{ data: boolean | null }> }; userId: string }) {
  const { data } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!data) throw new Error("Administrator access required.");
}

export const getAccountHome = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: roles, error } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId);
    if (error) throw new Error("Could not load your account.");
    const values = (roles ?? []).map((item) => roleSchema.parse(item.role));
    const role = values.includes("admin") ? "admin" : values.includes("advisor") ? "advisor" : "user";
    return { role, destination: role === "admin" ? "/admin" : role === "advisor" ? "/advisor" : "/student" } as const;
  });

export const claimStudentApplications = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = typeof context.claims.email === "string" ? context.claims.email.trim().toLowerCase() : "";
    if (!email) throw new Error("Your confirmed email address is required.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("leads").update({ student_user_id: context.userId }).ilike("email", email).is("student_user_id", null);
    if (error) throw new Error("Could not link your application.");
    const { data, error: readError } = await context.supabase.from("leads")
      .select("id, ref_code, full_name, selected_course, study_route, nearest_campus, intake, status, whatsapp_status, offer_email_status, created_at")
      .order("created_at", { ascending: false });
    if (readError) throw new Error("Could not load your applications.");
    return data ?? [];
  });

export const getAdvisorWorkspace = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: allowed } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "advisor" });
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!allowed && !isAdmin) throw new Error("Advisor access required.");
    let query = context.supabase.from("leads").select("id, ref_code, full_name, email, phone, city, selected_course, study_route, nearest_campus, status, notes, whatsapp_status, advisor_user_id, created_at").order("created_at", { ascending: false });
    if (!isAdmin) query = query.eq("advisor_user_id", context.userId);
    const { data, error } = await query;
    if (error) throw new Error("Could not load assigned applications.");
    return data ?? [];
  });

export const getAdvisors = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles, error } = await supabaseAdmin.from("user_roles").select("user_id").eq("role", "advisor");
    if (error) throw new Error("Could not load advisors.");
    const ids = (roles ?? []).map((row) => row.user_id);
    if (!ids.length) return [];
    const { data } = await supabaseAdmin.from("profiles").select("id, display_name, email").in("id", ids).order("display_name");
    return data ?? [];
  });

export const inviteAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ email: z.string().trim().email(), name: z.string().trim().min(2).max(100) }).parse(data))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const redirectTo = `${process.env['SITE_URL'] ?? "https://momentum1one.lovable.app"}/auth?setup=true`;
    const { data: invitation, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(data.email, { redirectTo, data: { full_name: data.name } });
    if (error || !invitation.user) throw new Error(error?.message ?? "Could not invite this advisor.");
    await supabaseAdmin.from("profiles").upsert({ id: invitation.user.id, display_name: data.name, email: data.email });
    await supabaseAdmin.from("user_roles").delete().eq("user_id", invitation.user.id).eq("role", "user");
    const { error: roleError } = await supabaseAdmin.from("user_roles").upsert({ user_id: invitation.user.id, role: "advisor" }, { onConflict: "user_id,role" });
    if (roleError) throw new Error("The invitation was sent, but the advisor role could not be applied.");
    return { ok: true };
  });

export const assignAdvisor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ leadId: z.string().uuid(), advisorId: z.string().uuid().nullable() }).parse(data))
  .handler(async ({ data, context }) => {
    await requireAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    if (data.advisorId) {
      const { data: role } = await supabaseAdmin.from("user_roles").select("id").eq("user_id", data.advisorId).eq("role", "advisor").maybeSingle();
      if (!role) throw new Error("Select a valid advisor.");
    }
    const { error } = await supabaseAdmin.from("leads").update({ advisor_user_id: data.advisorId }).eq("id", data.leadId);
    if (error) throw new Error("Could not assign this application.");
    return { ok: true };
  });

export const updateAssignedLead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data) => z.object({ leadId: z.string().uuid(), status: z.enum(["new", "contacted", "applied", "enrolled", "lost"]), notes: z.string().max(2000) }).parse(data))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    const { data: isAdvisor } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "advisor" });
    if (!isAdmin && !isAdvisor) throw new Error("Advisor access required.");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let query = supabaseAdmin.from("leads").update({ status: data.status, notes: data.notes }).eq("id", data.leadId);
    if (!isAdmin) query = query.eq("advisor_user_id", context.userId);
    const { data: changed, error } = await query.select("id").maybeSingle();
    if (error || !changed) throw new Error("You cannot update this application.");
    return { ok: true };
  });