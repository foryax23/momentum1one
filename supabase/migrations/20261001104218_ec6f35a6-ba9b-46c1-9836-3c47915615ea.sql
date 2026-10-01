create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "Users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

-- first account to sign up becomes admin
create or replace function public.grant_first_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_admin after insert on auth.users
for each row execute function public.grant_first_admin();

create sequence public.lead_ref_seq start 100;
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  ref_code text not null unique default ('MO-2027-' || lpad(nextval('public.lead_ref_seq')::text, 5, '0')),
  full_name text not null,
  email text not null,
  phone text not null,
  city text not null,
  interest text,
  intake text,
  consent boolean not null default false,
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default now()
);
grant select, update, delete on public.leads to authenticated;
grant all on public.leads to service_role;
grant usage on sequence public.lead_ref_seq to service_role;
alter table public.leads enable row level security;
create policy "Admins read leads" on public.leads for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update leads" on public.leads for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete leads" on public.leads for delete to authenticated using (public.has_role(auth.uid(), 'admin'));