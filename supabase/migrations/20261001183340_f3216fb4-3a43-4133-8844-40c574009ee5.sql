ALTER TABLE public.whatsapp_conversations
  ADD COLUMN IF NOT EXISTS bot_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS activated_via text,
  ADD COLUMN IF NOT EXISTS profile jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS reminders jsonb NOT NULL DEFAULT '{}'::jsonb;
UPDATE public.whatsapp_conversations c SET bot_enabled = true, activated_via = 'welcome'
  FROM public.leads l WHERE c.lead_id = l.id AND l.whatsapp_status = 'sent';