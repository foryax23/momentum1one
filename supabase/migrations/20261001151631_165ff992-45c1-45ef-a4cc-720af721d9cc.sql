DO $$ DECLARE c text; BEGIN
  SELECT conname INTO c FROM pg_constraint WHERE conrelid='public.leads'::regclass AND pg_get_constraintdef(oid) ILIKE '%whatsapp_status%';
  IF c IS NOT NULL THEN EXECUTE format('ALTER TABLE public.leads DROP CONSTRAINT %I', c); END IF;
END $$;
ALTER TABLE public.leads ADD CONSTRAINT leads_whatsapp_status_check CHECK (whatsapp_status IN ('pending','sending','sent','failed','awaiting_template'));
UPDATE public.leads SET whatsapp_status='awaiting_template' WHERE whatsapp_status='failed';