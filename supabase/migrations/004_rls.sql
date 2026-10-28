-- ODTHAN — 004 : privilèges + Row Level Security (RLS reste TOUJOURS activé)

-- Supabase accorde par défaut tous les droits : on repart de zéro, puis on accorde le strict nécessaire.
revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant usage on sequence public.service_request_seq to authenticated;

alter table public.profiles                enable row level security;
alter table public.user_roles              enable row level security;
alter table public.role_permissions        enable row level security;
alter table public.service_categories      enable row level security;
alter table public.services                enable row level security;
alter table public.site_settings           enable row level security;
alter table public.admin_activity_logs     enable row level security;
alter table public.notifications           enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.push_subscriptions      enable row level security;
alter table public.service_requests        enable row level security;
alter table public.service_request_history enable row level security;
alter table public.request_notes           enable row level security;
alter table public.request_attachments     enable row level security;
alter table public.conversations           enable row level security;
alter table public.messages                enable row level security;
alter table public.contact_messages        enable row level security;
alter table public.analytics_events        enable row level security;

-- ---------- profiles ----------
grant select on public.profiles to authenticated;
grant update (full_name, phone, country, city, preferred_language, deletion_requested_at) on public.profiles to authenticated;
create policy profiles_select on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_perm('clients.view'));
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- ---------- rôles ----------
grant select, insert, update, delete on public.user_roles to authenticated;
create policy roles_select on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.has_perm('users.manage'));
create policy roles_insert on public.user_roles for insert to authenticated
  with check (public.has_perm('users.manage'));
create policy roles_update on public.user_roles for update to authenticated
  using (public.has_perm('users.manage')) with check (public.has_perm('users.manage'));
create policy roles_delete on public.user_roles for delete to authenticated
  using (public.has_perm('users.manage'));

grant select on public.role_permissions to authenticated;
create policy role_permissions_select on public.role_permissions for select to authenticated using (true);

-- ---------- catégories ----------
grant select on public.service_categories to anon, authenticated;
grant insert, update, delete on public.service_categories to authenticated;
create policy categories_public on public.service_categories for select to anon, authenticated
  using (is_active);
create policy categories_staff_select on public.service_categories for select to authenticated
  using (public.has_perm('categories.manage') or public.has_perm('services.manage'));
create policy categories_insert on public.service_categories for insert to authenticated
  with check (public.has_perm('categories.manage'));
create policy categories_update on public.service_categories for update to authenticated
  using (public.has_perm('categories.manage')) with check (public.has_perm('categories.manage'));
create policy categories_delete on public.service_categories for delete to authenticated
  using (public.has_perm('categories.manage'));

-- ---------- services ----------
grant select on public.services to anon, authenticated;
grant insert, update, delete on public.services to authenticated;
create policy services_public on public.services for select to anon, authenticated
  using (status = 'published' and is_active
         and (category_id is null or exists (select 1 from public.service_categories c where c.id = category_id and c.is_active)));
create policy services_staff_select on public.services for select to authenticated
  using (public.has_perm('services.manage'));
create policy services_insert on public.services for insert to authenticated
  with check (public.has_perm('services.manage'));
create policy services_update on public.services for update to authenticated
  using (public.has_perm('services.manage')) with check (public.has_perm('services.manage'));
create policy services_delete on public.services for delete to authenticated
  using (public.has_perm('services.manage'));

-- ---------- paramètres ----------
grant select on public.site_settings to anon, authenticated;
grant insert, update on public.site_settings to authenticated;
create policy settings_read on public.site_settings for select to anon, authenticated using (true);
create policy settings_insert on public.site_settings for insert to authenticated
  with check (public.has_perm('settings.manage'));
create policy settings_update on public.site_settings for update to authenticated
  using (public.has_perm('settings.manage')) with check (public.has_perm('settings.manage'));

-- ---------- journal ----------
grant select, insert on public.admin_activity_logs to authenticated;
create policy logs_select on public.admin_activity_logs for select to authenticated
  using (public.has_perm('logs.view'));
create policy logs_insert on public.admin_activity_logs for insert to authenticated
  with check (actor_id = auth.uid() and public.is_staff());

-- ---------- notifications ----------
grant select, delete on public.notifications to authenticated;
grant update (read_at) on public.notifications to authenticated;
create policy notifications_select on public.notifications for select to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notifications_delete on public.notifications for delete to authenticated using (user_id = auth.uid());

grant select, insert, update on public.notification_preferences to authenticated;
create policy prefs_select on public.notification_preferences for select to authenticated using (user_id = auth.uid());
create policy prefs_insert on public.notification_preferences for insert to authenticated with check (user_id = auth.uid());
create policy prefs_update on public.notification_preferences for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, delete on public.push_subscriptions to authenticated;
create policy push_select on public.push_subscriptions for select to authenticated using (user_id = auth.uid());
create policy push_insert on public.push_subscriptions for insert to authenticated with check (user_id = auth.uid());
create policy push_delete on public.push_subscriptions for delete to authenticated using (user_id = auth.uid());

-- ---------- demandes ----------
create or replace function public.validate_request_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare s public.services;
begin
  select * into s from public.services where id = new.service_id;
  if s.id is null or s.status <> 'published' or not s.is_active or not s.allow_requests then
    raise exception 'Ce service n''accepte pas de demandes' using errcode = '22023';
  end if;
  new.service_name := s.name;   -- jamais fourni par le client
  new.status := 'new';
  return new;
end $$;
create trigger service_requests_validate before insert on public.service_requests
  for each row execute function public.validate_request_insert();

grant select on public.service_requests to authenticated;
grant insert (user_id, service_id, project_name, description, country, city, budget_amount,
              budget_currency, desired_date, contact_name, contact_phone, contact_email, service_name)
  on public.service_requests to authenticated;
grant update (status) on public.service_requests to authenticated;
create policy requests_select on public.service_requests for select to authenticated
  using (user_id = auth.uid() or public.has_perm('requests.view'));
create policy requests_insert on public.service_requests for insert to authenticated
  with check (user_id = auth.uid());
create policy requests_update_staff on public.service_requests for update to authenticated
  using (public.has_perm('requests.manage')) with check (public.has_perm('requests.manage'));
create policy requests_cancel_owner on public.service_requests for update to authenticated
  using (user_id = auth.uid() and status in ('new','analyzing','info_required','quote_sent'))
  with check (user_id = auth.uid() and status = 'cancelled');

grant select on public.service_request_history to authenticated;
create policy history_select on public.service_request_history for select to authenticated
  using (public.has_perm('requests.view')
         or exists (select 1 from public.service_requests r where r.id = request_id and r.user_id = auth.uid()));

grant select, insert on public.request_notes to authenticated;   -- staff uniquement
create policy notes_select on public.request_notes for select to authenticated using (public.has_perm('requests.view'));
create policy notes_insert on public.request_notes for insert to authenticated
  with check (public.has_perm('requests.manage') and author_id = auth.uid());

grant select, insert, delete on public.request_attachments to authenticated;
create policy attachments_select on public.request_attachments for select to authenticated
  using (public.has_perm('requests.view')
         or exists (select 1 from public.service_requests r where r.id = request_id and r.user_id = auth.uid()));
create policy attachments_insert on public.request_attachments for insert to authenticated
  with check (storage_path like auth.uid()::text || '/%'
              and exists (select 1 from public.service_requests r where r.id = request_id and r.user_id = auth.uid()));
create policy attachments_delete on public.request_attachments for delete to authenticated
  using (exists (select 1 from public.service_requests r where r.id = request_id and r.user_id = auth.uid()));

-- ---------- messagerie ----------
grant select on public.conversations to authenticated;
create policy conversations_select on public.conversations for select to authenticated
  using (user_id = auth.uid() or public.has_perm('requests.view'));

grant select, insert on public.messages to authenticated;
create policy messages_select on public.messages for select to authenticated
  using (public.has_perm('requests.view')
         or exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy messages_insert_client on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and not is_staff
              and exists (select 1 from public.conversations c where c.id = conversation_id and c.user_id = auth.uid()));
create policy messages_insert_staff on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and is_staff and public.has_perm('messages.reply'));

-- ---------- contact (insertion uniquement via le serveur / service role) ----------
grant select on public.contact_messages to authenticated;
grant update (status) on public.contact_messages to authenticated;
create policy contact_select on public.contact_messages for select to authenticated using (public.has_perm('contact.manage'));
create policy contact_update on public.contact_messages for update to authenticated
  using (public.has_perm('contact.manage')) with check (public.has_perm('contact.manage'));

-- ---------- analytique (insertion uniquement via le serveur / service role) ----------
grant select on public.analytics_events to authenticated;
create policy analytics_select on public.analytics_events for select to authenticated
  using (public.has_perm('analytics.view'));

-- ---------- temps réel ----------
do $$ begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    alter publication supabase_realtime add table public.notifications;
    alter publication supabase_realtime add table public.messages;
  end if;
end $$;
