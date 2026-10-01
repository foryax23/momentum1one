CREATE TABLE public.profiles (
  id uuid PRIMARY KEY,
  display_name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());
CREATE POLICY "Admins read profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert profiles" ON public.profiles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update profiles" ON public.profiles FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

ALTER TABLE public.leads
  ADD COLUMN student_user_id uuid,
  ADD COLUMN advisor_user_id uuid;
CREATE INDEX leads_student_user_id_idx ON public.leads(student_user_id);
CREATE INDEX leads_advisor_user_id_idx ON public.leads(advisor_user_id);

CREATE POLICY "Students read own applications" ON public.leads FOR SELECT TO authenticated USING (student_user_id = auth.uid());
CREATE POLICY "Advisors read assigned applications" ON public.leads FOR SELECT TO authenticated USING (advisor_user_id = auth.uid() AND public.has_role(auth.uid(), 'advisor'));

CREATE POLICY "Advisors read assigned conversations" ON public.whatsapp_conversations FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'advisor') AND EXISTS (
    SELECT 1 FROM public.leads WHERE leads.id = whatsapp_conversations.lead_id AND leads.advisor_user_id = auth.uid()
  )
);
CREATE POLICY "Advisors read assigned messages" ON public.whatsapp_messages FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'advisor') AND EXISTS (
    SELECT 1 FROM public.whatsapp_conversations
    JOIN public.leads ON leads.id = whatsapp_conversations.lead_id
    WHERE whatsapp_conversations.id = whatsapp_messages.conversation_id AND leads.advisor_user_id = auth.uid()
  )
);
CREATE POLICY "Advisors read assigned documents" ON public.admission_documents FOR SELECT TO authenticated USING (
  public.has_role(auth.uid(), 'advisor') AND EXISTS (
    SELECT 1 FROM public.leads WHERE leads.id = admission_documents.lead_id AND leads.advisor_user_id = auth.uid()
  )
);

CREATE OR REPLACE FUNCTION public.touch_profile_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER touch_profile_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_profile_updated_at();

CREATE OR REPLACE FUNCTION public.grant_first_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'full_name', split_part(COALESCE(new.email, ''), '@', 1)), new.email)
  ON CONFLICT (id) DO NOTHING;

  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'admin') ON CONFLICT DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'user') ON CONFLICT DO NOTHING;
  END IF;
  RETURN new;
END;
$$;