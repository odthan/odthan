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
alter table public.analytics_events add constraint analytics_events_event_type_check
  check (event_type in ('page_view','service_view','request_submitted','whatsapp_click','social_click'));
alter table public.analytics_events add column social_link_id uuid references public.social_links(id) on delete set null;

-- Les 9 plateformes officielles (créées une seule fois)
insert into public.social_links(platform, name, url, sort_order)
select v.platform, v.name, v.url, v.sort_order from (values
  ('x',         'X',              'https://x.com/Odthan', 10),
  ('facebook',  'Facebook',       'https://www.facebook.com/0dthan', 20),
  ('instagram', 'Instagram',      'https://www.instagram.com/0dthan', 30),
  ('tiktok',    'TikTok',         'https://tiktok.com/@0dthan', 40),
  ('clapper',   'Clapper',        'https://clapperapp.com/ODTHAN', 50),
  ('pinterest', 'Pinterest',      'https://pin.it/CtbeDv24Y', 60),
  ('youtube',   'YouTube',        'https://www.youtube.com/@Odthan-InfGlo', 70),
  ('whatsapp',  'Chèn WhatsApp',  'https://whatsapp.com/channel/0029VbDlDmwK5cDHTyJc1O3R', 80),
  ('whatsapp',  'WhatsApp Prive', 'https://wa.me/message/2TYS4RRA5CMXA1', 90)
) as v(platform, name, url, sort_order)
where not exists (select 1 from public.social_links);

-- analytics_summary mise à jour (ajoute top_social)
create or replace function public.analytics_summary(p_from timestamptz, p_to timestamptz)
returns jsonb language plpgsql stable security definer set search_path = public as $$
declare r jsonb;
begin
  if not public.has_perm('analytics.view') then
    raise exception 'Permission refusée' using errcode = '42501';
  end if;
  with ev as (select * from public.analytics_events where created_at >= p_from and created_at < p_to),
       pv as (select * from ev where event_type = 'page_view'),
       req as (select count(*) c from public.service_requests where created_at >= p_from and created_at < p_to),
       sv as (select count(distinct session_id) c from ev where event_type = 'service_view')
  select jsonb_build_object(
    'visitors',      (select count(distinct visitor_id) from pv),
    'sessions',      (select count(distinct session_id) from pv),
    'page_views',    (select count(*) from pv),
    'service_views', (select count(*) from ev where event_type = 'service_view'),
    'signups',       (select count(*) from public.profiles where created_at >= p_from and created_at < p_to),
    'requests',      (select c from req),
    'service_view_sessions', (select c from sv),
    'conversion_pct', (select case when sv.c = 0 then null else round(100.0 * req.c / sv.c, 1) end from req, sv),
    'daily', (select coalesce(jsonb_agg(d order by d.day), '[]'::jsonb) from (
        select date_trunc('day', created_at)::date as day,
               count(*) as page_views, count(distinct session_id) as sessions
        from pv group by 1) d),
    'top_social', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select l.name as label, count(*) as value from ev join public.social_links l on l.id = ev.social_link_id
        where ev.event_type = 'social_click' group by l.name order by 2 desc) t),
    'top_pages', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select path as label, count(*) as value from pv group by path order by 2 desc limit 10) t),
    'top_services', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select s.name as label, count(*) as value from ev join public.services s on s.id = ev.service_id
        where ev.event_type = 'service_view' group by s.name order by 2 desc limit 10) t),
    'top_categories', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select c.name as label, count(*) as value from ev join public.service_categories c on c.id = ev.category_id
        where ev.event_type = 'service_view' group by c.name order by 2 desc limit 10) t),
    'sources', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(utm_source, referrer_host, 'direct') as label, count(distinct session_id) as value
        from pv group by 1 order by 2 desc limit 10) t),
    'campaigns', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select utm_campaign as label, count(distinct session_id) as value
        from pv where utm_campaign is not null group by 1 order by 2 desc limit 10) t),
    'devices', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(device, 'inconnu') as label, count(distinct session_id) as value from pv group by 1 order by 2 desc) t),
    'browsers', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select coalesce(browser, 'inconnu') as label, count(distinct session_id) as value from pv group by 1 order by 2 desc limit 8) t),
    'countries', (select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select country as label, count(distinct session_id) as value from pv where country is not null group by 1 order by 2 desc limit 10) t)
  ) into r;
  return r;
end $$;

