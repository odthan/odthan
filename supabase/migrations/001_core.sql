-- ODTHAN — 001 : profils, rôles, permissions, catégories, services
-- À exécuter dans l'ordre 001 → 006 (Supabase > SQL Editor ou `supabase db push`).

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

-- ---------- Profils ----------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text check (char_length(full_name) <= 120),
  email text,
  phone text check (char_length(phone) <= 40),
  country text check (char_length(country) <= 80),
  city text check (char_length(city) <= 80),
  preferred_language text not null default 'fr' check (preferred_language in ('fr','ht')),
  deletion_requested_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger profiles_updated before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------- Rôles et permissions (jamais dans le navigateur) ----------
create table public.user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('SUPER_ADMIN','ADMIN','MANAGER','EDITOR','SUPPORT','CLIENT')),
  is_active boolean not null default true,
  granted_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);
create index user_roles_role_idx on public.user_roles(role) where is_active;

create table public.role_permissions (
  role text not null check (role in ('SUPER_ADMIN','ADMIN','MANAGER','EDITOR','SUPPORT','CLIENT')),
  permission text not null,
  primary key (role, permission)
);

create or replace function public.has_perm(p text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.user_roles ur
    join public.role_permissions rp on rp.role = ur.role
    where ur.user_id = auth.uid() and ur.is_active and rp.permission = p)
$$;

create or replace function public.is_staff()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles
    where user_id = auth.uid() and is_active and role <> 'CLIENT')
$$;

create or replace function public.my_access()
returns jsonb language sql stable security definer set search_path = public as $$
  select jsonb_build_object(
    'roles', coalesce((select jsonb_agg(role) from public.user_roles where user_id = auth.uid() and is_active), '[]'::jsonb),
    'permissions', coalesce((select jsonb_agg(distinct rp.permission)
        from public.user_roles ur join public.role_permissions rp on rp.role = ur.role
        where ur.user_id = auth.uid() and ur.is_active), '[]'::jsonb))
$$;

-- Garde-fous : personne ne peut s'auto-promouvoir ; seul un SUPER_ADMIN gère SUPER_ADMIN/ADMIN ;
-- le dernier SUPER_ADMIN actif ne peut pas être retiré. (auth.uid() NULL = SQL Editor / service role.)
create or replace function public.guard_user_roles()
returns trigger language plpgsql security definer set search_path = public as $$
declare target_role text := coalesce(new.role, old.role);
        target_user uuid := coalesce(new.user_id, old.user_id);
begin
  if auth.uid() is not null then
    if not public.has_perm('users.manage') then
      raise exception 'Permission refusée' using errcode = '42501';
    end if;
    if target_user = auth.uid() then
      raise exception 'Vous ne pouvez pas modifier vos propres rôles' using errcode = '42501';
    end if;
    if target_role in ('SUPER_ADMIN','ADMIN') and not exists (
        select 1 from public.user_roles where user_id = auth.uid() and role = 'SUPER_ADMIN' and is_active) then
      raise exception 'Seul un SUPER_ADMIN peut gérer ce rôle' using errcode = '42501';
    end if;
  end if;
  if tg_op in ('DELETE','UPDATE') and old.role = 'SUPER_ADMIN' and old.is_active
     and (tg_op = 'DELETE' or new.role <> 'SUPER_ADMIN' or not new.is_active) then
    if not exists (select 1 from public.user_roles where role = 'SUPER_ADMIN' and is_active and user_id <> old.user_id) then
      raise exception 'Impossible de retirer le dernier SUPER_ADMIN' using errcode = '42501';
    end if;
  end if;
  if tg_op = 'INSERT' then new.granted_by := coalesce(auth.uid(), new.granted_by); end if;
  return coalesce(new, old);
end $$;
create trigger user_roles_guard before insert or update or delete on public.user_roles
  for each row execute function public.guard_user_roles();

-- Procédure d'initialisation du premier SUPER_ADMIN (SQL Editor uniquement).
create or replace function public.bootstrap_super_admin(p_email text)
returns text language plpgsql security definer set search_path = public, auth as $$
declare uid uuid;
begin
  if exists (select 1 from public.user_roles where role = 'SUPER_ADMIN' and is_active) then
    raise exception 'Un SUPER_ADMIN existe déjà : procédure refusée';
  end if;
  select id into uid from auth.users where lower(email) = lower(p_email) and email_confirmed_at is not null;
  if uid is null then
    raise exception 'Aucun compte confirmé avec cet e-mail : créez le compte et confirmez l''e-mail d''abord';
  end if;
  insert into public.user_roles(user_id, role) values (uid, 'SUPER_ADMIN') on conflict do nothing;
  return 'SUPER_ADMIN attribué à ' || p_email;
end $$;
revoke all on function public.bootstrap_super_admin(text) from public, anon, authenticated;

-- ---------- Catégories ----------
create table public.service_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  name text not null check (char_length(name) between 2 and 100),
  description text check (char_length(description) <= 500),
  icon text check (char_length(icon) <= 40),
  image_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger categories_updated before update on public.service_categories
  for each row execute function public.set_updated_at();

-- ---------- Services ----------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 80),
  category_id uuid references public.service_categories(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 120),
  short_description text not null check (char_length(short_description) between 5 and 300),
  description text check (char_length(description) <= 8000),
  logo_path text,
  cover_path text,
  official_url text check (official_url ~* '^https?://[^\s]+$' and char_length(official_url) <= 500),
  countries text[] not null default '{}',
  languages text[] not null default '{}',
  pricing_type text not null default 'quote' check (pricing_type in ('fixed','indicative','quote')),
  price numeric(12,2) check (price is null or price >= 0),
  currency text check (currency is null or currency ~ '^[A-Z]{3}$'),
  contact_phone text check (char_length(contact_phone) <= 40),
  contact_button_label text check (char_length(contact_button_label) <= 60),
  contact_button_url text check (contact_button_url is null or contact_button_url ~* '^(https?://|mailto:|tel:)[^\s]+$'),
  allow_requests boolean not null default true,
  sort_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft','published','unpublished')),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  published_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (pricing_type = 'quote' or price is not null)
);
create index services_public_idx on public.services(status, is_active, sort_order);
create index services_category_idx on public.services(category_id);
create trigger services_updated before update on public.services
  for each row execute function public.set_updated_at();

create or replace function public.services_set_published_at()
returns trigger language plpgsql as $$
begin
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := now();
  end if;
  return new;
end $$;
create trigger services_published before insert or update on public.services
  for each row execute function public.services_set_published_at();

-- ---------- Paramètres du site (non secrets) ----------
create table public.site_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

-- ---------- Journal d'activité administrative ----------
create table public.admin_activity_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index admin_logs_created_idx on public.admin_activity_logs(created_at desc);
