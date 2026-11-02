-- ODTHAN SOSYAL — partie 3/3 du fichier 007_sosyal.sql

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
