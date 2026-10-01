ALTER TABLE public.whatsapp_conversations
  ADD COLUMN detected_language text,
  ADD COLUMN admissions_step text NOT NULL DEFAULT 'confirm_identity',
  ADD COLUMN opted_out_at timestamptz,
  ADD COLUMN last_outbound_at timestamptz;

ALTER TABLE public.whatsapp_messages
  ADD COLUMN reply_attempts int NOT NULL DEFAULT 0,
  ADD COLUMN reply_next_attempt_at timestamptz,
  ADD COLUMN reply_started_at timestamptz,
  ADD COLUMN media_id text,
  ADD COLUMN media_type text,
  ADD COLUMN media_mime_type text,
  ADD COLUMN media_filename text,
  ADD COLUMN media_size bigint,
  ADD COLUMN media_sha256 text,
  ADD COLUMN media_status text,
  ADD COLUMN media_attempts int NOT NULL DEFAULT 0,
  ADD COLUMN media_next_attempt_at timestamptz,
  ADD COLUMN media_error text;

CREATE INDEX whatsapp_messages_reply_queue_idx ON public.whatsapp_messages(reply_status, reply_next_attempt_at, created_at);
CREATE INDEX whatsapp_messages_media_queue_idx ON public.whatsapp_messages(media_status, media_next_attempt_at, created_at);

CREATE TABLE public.admission_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  whatsapp_message_id uuid REFERENCES public.whatsapp_messages(id) ON DELETE SET NULL,
  document_type text NOT NULL CHECK (document_type IN ('identity','proof_of_address','immigration_status','qualifications','english_evidence','cv','unclassified')),
  original_filename text,
  mime_type text NOT NULL,
  file_size bigint NOT NULL CHECK (file_size > 0 AND file_size <= 10485760),
  storage_path text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'received' CHECK (status IN ('received','reviewed','replacement_requested','replaced')),
  replacement_reason text,
  received_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.admission_documents TO authenticated;
GRANT ALL ON public.admission_documents TO service_role;
ALTER TABLE public.admission_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read admission documents" ON public.admission_documents FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update admission documents" ON public.admission_documents FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX admission_documents_lead_idx ON public.admission_documents(lead_id, received_at DESC);
CREATE INDEX admission_documents_status_idx ON public.admission_documents(status, received_at);

CREATE OR REPLACE FUNCTION public.touch_admission_document_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER touch_admission_document_updated_at
BEFORE UPDATE ON public.admission_documents
FOR EACH ROW EXECUTE FUNCTION public.touch_admission_document_updated_at();

CREATE POLICY "Admins read admission files" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'admissions-documents' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update admission files" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'admissions-documents' AND public.has_role(auth.uid(), 'admin')) WITH CHECK (bucket_id = 'admissions-documents' AND public.has_role(auth.uid(), 'admin'));

UPDATE public.whatsapp_messages
SET reply_status = 'pending', reply_started_at = NULL, reply_next_attempt_at = now()
WHERE reply_status = 'sending';