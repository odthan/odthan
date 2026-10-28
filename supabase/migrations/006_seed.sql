-- ODTHAN — 006 : permissions, paramètres, catégories et les deux services existants

insert into public.role_permissions(role, permission) values
 ('SUPER_ADMIN','services.manage'),('SUPER_ADMIN','categories.manage'),('SUPER_ADMIN','requests.view'),
 ('SUPER_ADMIN','requests.manage'),('SUPER_ADMIN','messages.reply'),('SUPER_ADMIN','clients.view'),
 ('SUPER_ADMIN','analytics.view'),('SUPER_ADMIN','users.manage'),('SUPER_ADMIN','settings.manage'),
 ('SUPER_ADMIN','contact.manage'),('SUPER_ADMIN','logs.view'),
 ('ADMIN','services.manage'),('ADMIN','categories.manage'),('ADMIN','requests.view'),
 ('ADMIN','requests.manage'),('ADMIN','messages.reply'),('ADMIN','clients.view'),
 ('ADMIN','analytics.view'),('ADMIN','users.manage'),('ADMIN','contact.manage'),('ADMIN','logs.view'),
 ('MANAGER','services.manage'),('MANAGER','requests.view'),('MANAGER','requests.manage'),
 ('MANAGER','messages.reply'),('MANAGER','analytics.view'),('MANAGER','contact.manage'),
 ('EDITOR','services.manage'),('EDITOR','categories.manage'),
 ('SUPPORT','requests.view'),('SUPPORT','messages.reply'),('SUPPORT','contact.manage')
on conflict do nothing;

insert into public.site_settings(key, value) values
 ('site',    '{"name":"ODTHAN","tagline":"Infinite Vision. Global Ambition.","description":"Portail central des services et activités ODTHAN."}'),
 ('contact', '{"whatsapp_number":"50940894038","whatsapp_url":"https://wa.me/50940894038","support_email":"","support_hours":""}'),
 ('locale',  '{"default_language":"fr","timezone":"America/Port-au-Prince"}'),
 ('seo',     '{"title":"ODTHAN — Infinite Vision. Global Ambition.","description":"Découvrez les services professionnels ODTHAN : construction, services numériques et plus."}')

on conflict (key) do nothing;

insert into public.service_categories(slug, name, description, icon, sort_order) values
 ('construction', 'Construction', 'Travaux de construction et de rénovation.', 'hammer', 10),
 ('services-numeriques-et-informatiques', 'Services numériques et informatiques', 'Sites Internet, boutiques en ligne et solutions numériques.', 'monitor', 20),
 ('marketing-digital', 'Marketing digital', 'Présence en ligne, réseaux sociaux et référencement.', 'megaphone', 30),
 ('creation-d-entreprise', 'Création d''entreprise', 'Accompagnement pour lancer et structurer une activité.', 'briefcase', 40),
 ('commerce', 'Commerce', 'Activités commerciales et distribution.', 'shopping-bag', 50),
 ('autres-services', 'Autres services', 'Autres prestations professionnelles.', 'grid', 60)
on conflict (slug) do nothing;

-- Services existants (modifiables depuis /admin/services ; les sites eux-mêmes ne sont pas modifiés)
insert into public.services(slug, category_id, name, short_description, description, official_url,
    countries, languages, pricing_type, allow_requests, sort_order, status, is_featured)
select 'konstrival', c.id, 'KONSTRIVAL',
  'Service spécialisé dans les travaux de construction, notamment la pose de carrelage.',
  'KONSTRIVAL est spécialisé dans les travaux de construction, notamment la pose de carrelage, ainsi que les autres prestations réellement proposées par KONSTRIVAL. Consultez le site officiel pour le détail des services.',
  'https://konstrival.odthan.com', array['Haïti','République dominicaine'], array['Créole haïtien','Français','Espagnol'],
  'quote', true, 10, 'published', true
from public.service_categories c where c.slug = 'construction'
on conflict (slug) do nothing;

insert into public.services(slug, category_id, name, short_description, description, official_url,
    countries, languages, pricing_type, allow_requests, sort_order, status, is_featured)
select 'odthan-business', c.id, 'ODTHAN Business',
  'Services numériques et professionnels : sites Internet, boutiques en ligne, identité visuelle et référencement.',
  'ODTHAN Business propose des services numériques et professionnels pouvant inclure la création de sites Internet, de boutiques en ligne, de pages professionnelles sur les réseaux sociaux, de noms de domaine, d''identités visuelles et de référencement.',
  'https://business.odthan.com', array['Haïti','République dominicaine'], array['Français','Créole haïtien'],
  'quote', true, 20, 'published', true
from public.service_categories c where c.slug = 'services-numeriques-et-informatiques'
on conflict (slug) do nothing;
