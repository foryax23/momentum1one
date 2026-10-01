ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS selected_course text,
  ADD COLUMN IF NOT EXISTS study_route text,
  ADD COLUMN IF NOT EXISTS offer_token_hash text,
  ADD COLUMN IF NOT EXISTS offer_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS offer_email_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS offer_email_sent_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS leads_offer_token_hash_key
  ON public.leads (offer_token_hash)
  WHERE offer_token_hash IS NOT NULL;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_offer_email_status_valid
  CHECK (offer_email_status IN ('pending', 'sent', 'suppressed', 'failed', 'domain_pending'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.leads TO authenticated;
GRANT ALL ON public.leads TO service_role;