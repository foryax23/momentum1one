ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS whatsapp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS nearest_campus text,
  ADD COLUMN IF NOT EXISTS distance_miles integer,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS campaign text,
  ADD COLUMN IF NOT EXISTS page text;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_distance_miles_nonnegative CHECK (distance_miles IS NULL OR distance_miles >= 0);