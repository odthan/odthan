-- ODTHAN SOSYAL — partie 2/3 du fichier 007_sosyal.sql
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
