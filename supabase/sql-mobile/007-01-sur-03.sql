-- ODTHAN SOSYAL — partie 1/3 du fichier 007_sosyal.sql
-- ODTHAN SOSYAL — 007 : réseaux sociaux officiels (gestion dynamique, SUPER_ADMIN uniquement) + clics mesurés

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('x','facebook','instagram','tiktok','clapper','pinterest','youtube','whatsapp','link')),
  name text not null check (char_length(name) between 1 and 40),
  url text not null check (url ~* '^https?://[^\s]+$' and char_length(url) <= 500),
  icon_path text,
  sort_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index social_links_public_idx on public.social_links(is_active, sort_order);
create trigger social_links_updated before update on public.social_links
  for each row execute function public.set_updated_at();

-- Permission réservée au SUPER_ADMIN
insert into public.role_permissions(role, permission) values ('SUPER_ADMIN', 'social.manage') on conflict do nothing;

-- RLS : lecture publique des liens actifs ; gestion par social.manage uniquement
alter table public.social_links enable row level security;
revoke all on public.social_links from anon, authenticated;   -- on repart de zéro (Supabase accorde tout par défaut)
grant select on public.social_links to anon, authenticated;
grant insert, update, delete on public.social_links to authenticated;
create policy social_public on public.social_links for select to anon, authenticated using (is_active);
create policy social_staff_select on public.social_links for select to authenticated using (public.has_perm('social.manage'));
create policy social_insert on public.social_links for insert to authenticated with check (public.has_perm('social.manage'));
create policy social_update on public.social_links for update to authenticated
  using (public.has_perm('social.manage')) with check (public.has_perm('social.manage'));
create policy social_delete on public.social_links for delete to authenticated using (public.has_perm('social.manage'));

-- Stockage des icônes personnalisées (facultatif)
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('social-media', 'social-media', true, 1048576, array['image/jpeg','image/png','image/webp','image/svg+xml'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;
create policy "social media write" on storage.objects for insert to authenticated
  with check (bucket_id = 'social-media' and public.has_perm('social.manage'));
create policy "social media update" on storage.objects for update to authenticated
  using (bucket_id = 'social-media' and public.has_perm('social.manage'));
create policy "social media delete" on storage.objects for delete to authenticated
  using (bucket_id = 'social-media' and public.has_perm('social.manage'));

-- Clics : nouvel évènement + lien vers la plateforme cliquée
alter table public.analytics_events drop constraint if exists analytics_events_event_type_check;
