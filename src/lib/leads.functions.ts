import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { UK_CITIES } from "./funnel";

const leadSchema = z.object({
  full_name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z
    .string()
    .trim()
    .max(20)
    .regex(/^(\+44\s?7\d{3}|07\d{3})\s?\d{3}\s?\d{3}$/, "Invalid UK mobile"),
  city: z.enum(UK_CITIES),
  interest: z.string().trim().max(60).nullable(),
  intake: z.string().trim().max(60).nullable(),
  consent: z.literal(true),
});

export const submitLead = createServerFn({ method: "POST" })
  .inputValidator((data) => leadSchema.parse(data))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("leads")
      .insert(data)
      .select("ref_code, full_name, city, interest, intake, created_at")
      .single();
    if (error) {
      console.error(error);
      throw new Error("Could not save your details. Please try again.");
    }
    return row;
  });
