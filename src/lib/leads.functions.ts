import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { CAMPUSES, UK_CITIES } from "./funnel";
import { CAMPUS_COURSES, campusName } from "./offer-catalog";

const leadSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^(\+\d{1,4}\s?\d{6,14}|07\d{3}\s?\d{3}\s?\d{3})$/, "Invalid mobile"),
  city: z.enum(UK_CITIES),
  interest: z.string().trim().max(60).nullable(),
  intake: z.string().trim().max(60).nullable(),
  consent: z.literal(true),
  whatsapp: z.boolean(),
  nearest_campus: z.enum(CAMPUSES.map((campus) => campus.full) as [string, ...string[]]),
  distance_miles: z.number().int().min(0).max(1000),
  source: z.string().trim().max(100).nullable(),
  campaign: z.string().trim().max(100).nullable(),
  page: z.string().trim().max(500).nullable(),
  website: z.string().max(0),
  selected_course: z.string().trim().min(2).max(120),
  study_route: z.enum(["Foundation Year", "Year 1"]),
});

export const submitLead = createServerFn({ method: "POST" })
  .validator((data) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    const { website: _website, ...lead } = data;
    const available = CAMPUS_COURSES[campusName(lead.nearest_campus)] ?? [];
    if (!available.some((course) => course.title === lead.selected_course && course.route === lead.study_route)) {
      throw new Error("That course is not available at the selected campus.");
    }
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
    const offer_token_hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const offer_expires_at = new Date(Date.now() + 30 * 864e5).toISOString();
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("leads")
      .insert({ ...lead, offer_token_hash, offer_expires_at, offer_email_status: "domain_pending" })
      .select("id, phone, ref_code, full_name, city, interest, intake, nearest_campus, distance_miles, created_at, selected_course, study_route")
      .single();
    if (error) {
      console.error(error);
      throw new Error("Could not save your details. Please try again.");
    }
    const { sendWelcome } = await import("./whatsapp.server");
    await sendWelcome(row);
    const { id: _id, phone: _phone, ...publicRow } = row;
    return { ...publicRow, offer_url: `/offer/${token}` };
  });

export const getOffer = createServerFn({ method: "GET" })
  .validator((data) => z.object({ token: z.string().regex(/^[a-f0-9]{64}$/) }).parse(data))
  .handler(async ({ data }) => {
    const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(data.token));
    const hash = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("leads")
      .select("ref_code, full_name, city, interest, intake, nearest_campus, distance_miles, created_at, selected_course, study_route")
      .eq("offer_token_hash", hash).gt("offer_expires_at", new Date().toISOString()).maybeSingle();
    if (error || !row) throw new Error("This offer link is invalid or has expired.");
    return { ...row, offer_url: `/offer/${data.token}` };
  });
