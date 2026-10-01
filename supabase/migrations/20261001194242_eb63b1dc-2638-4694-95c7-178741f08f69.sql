ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS privacy_acknowledged_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS email_marketing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS phone_marketing boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS whatsapp_marketing boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.leads.privacy_acknowledged_at IS 'When the applicant acknowledged the privacy notice for enquiry handling.';
COMMENT ON COLUMN public.leads.email_marketing IS 'Optional consent to receive email marketing.';
COMMENT ON COLUMN public.leads.phone_marketing IS 'Optional consent to receive phone marketing.';
COMMENT ON COLUMN public.leads.whatsapp_marketing IS 'Optional consent to receive WhatsApp marketing.';