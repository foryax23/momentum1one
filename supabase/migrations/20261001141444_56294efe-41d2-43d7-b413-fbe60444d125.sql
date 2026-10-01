ALTER TABLE public.leads ADD COLUMN whatsapp_status text NOT NULL DEFAULT 'pending';

CREATE TABLE public.whatsapp_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  delivery_id text NOT NULL UNIQUE,
  event text NOT NULL,
  payload jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  processing_error text,
  attempts int NOT NULL DEFAULT 0
);
GRANT SELECT ON public.whatsapp_webhook_events TO authenticated;
GRANT ALL ON public.whatsapp_webhook_events TO service_role;
ALTER TABLE public.whatsapp_webhook_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read webhook events" ON public.whatsapp_webhook_events FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  wa_phone text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'bot' CHECK (status IN ('bot','queued','agent','closed')),
  queued_at timestamptz,
  summary text,
  last_inbound_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.whatsapp_conversations TO authenticated;
GRANT ALL ON public.whatsapp_conversations TO service_role;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read conversations" ON public.whatsapp_conversations FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update conversations" ON public.whatsapp_conversations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  direction text NOT NULL CHECK (direction IN ('in','bot','agent','system')),
  body text NOT NULL DEFAULT '',
  wa_message_id text UNIQUE,
  status text NOT NULL DEFAULT 'accepted',
  error text,
  reply_status text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX whatsapp_messages_conv_idx ON public.whatsapp_messages(conversation_id, created_at);
GRANT SELECT ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read messages" ON public.whatsapp_messages FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));