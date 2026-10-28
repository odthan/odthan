-- ODTHAN — 003 : analytique (collecte minimale, sans IP, sans données personnelles)

create table public.analytics_events (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  event_type text not null check (event_type in ('page_view','service_view','request_submitted','whatsapp_click')),
  path text check (char_length(path) <= 300),
  service_id uuid references public.services(id) on delete set null,
  category_id uuid references public.service_categories(id) on delete set null,
  session_id text check (char_length(session_id) <= 64),
  visitor_id text check (char_length(visitor_id) <= 64),
  referrer_host text check (char_length(referrer_host) <= 200),
  utm_source text check (char_length(utm_source) <= 100),
  utm_medium text check (char_length(utm_medium) <= 100),
  utm_campaign text check (char_length(utm_campaign) <= 100),
  device text check (device in ('mobile','tablet','desktop')),
  browser text check (char_length(browser) <= 40),
  country text check (char_length(country) <= 2)
);
create index analytics_created_idx on public.analytics_events(created_at);
create index analytics_type_idx on public.analytics_events(event_type, created_at);

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
revoke all on function public.analytics_summary(timestamptz, timestamptz) from public, anon;
grant execute on function public.analytics_summary(timestamptz, timestamptz) to authenticated;
