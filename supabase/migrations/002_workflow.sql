-- ODTHAN — 002 : demandes, historique, notes internes, messagerie, notifications, contact

-- ---------- Notifications ----------
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications(user_id, created_at desc);
create index notifications_unread_idx on public.notifications(user_id) where read_at is null;

create table public.notification_preferences (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  sound_enabled boolean not null default true,
  volume numeric(3,2) not null default 0.7 check (volume between 0 and 1),
  sound_events text[] not null default array['new_request','new_message','new_registration','contact_message','request_updated','status_changed','reply','request_received'],
  push_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);
create index push_subscriptions_user_idx on public.push_subscriptions(user_id);

create or replace function public.notify_staff(
  p_perm text, p_type text, p_title text, p_body text, p_link text,
  p_data jsonb default '{}'::jsonb, p_exclude uuid default null)
returns void language sql security definer set search_path = public as $$
  insert into public.notifications(user_id, type, title, body, link, data)
  select distinct ur.user_id, p_type, p_title, p_body, p_link, p_data
  from public.user_roles ur
  join public.role_permissions rp on rp.role = ur.role
  where ur.is_active and rp.permission = p_perm
    and ur.user_id is distinct from p_exclude
    and exists (select 1 from public.profiles p where p.id = ur.user_id)
$$;
revoke all on function public.notify_staff(text,text,text,text,text,jsonb,uuid) from public, anon, authenticated;

-- Création automatique du profil à l'inscription
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles(id, email, full_name, country, preferred_language)
  values (new.id, new.email,
    left(nullif(new.raw_user_meta_data->>'full_name',''), 120),
    left(nullif(new.raw_user_meta_data->>'country',''), 80),
    case when new.raw_user_meta_data->>'lang' = 'ht' then 'ht' else 'fr' end)
  on conflict (id) do nothing;
  perform public.notify_staff('clients.view', 'new_registration', 'Nouvelle inscription',
    coalesce(new.email, ''), '/admin/clients', jsonb_build_object('user_id', new.id));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Demandes de services ----------
create sequence public.service_request_seq;

create table public.service_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique
    default ('REQ-' || to_char(now(), 'YYYY') || '-' || lpad(nextval('public.service_request_seq')::text, 5, '0')),
  user_id uuid not null references public.profiles(id) on delete cascade,
  service_id uuid references public.services(id) on delete set null,
  service_name text not null,
  project_name text not null check (char_length(project_name) between 2 and 150),
  description text not null check (char_length(description) between 10 and 5000),
  country text not null check (char_length(country) between 2 and 80),
  city text check (char_length(city) <= 80),
  budget_amount numeric(14,2) check (budget_amount is null or budget_amount >= 0),
  budget_currency text check (budget_currency is null or budget_currency ~ '^[A-Z]{3}$'),
  desired_date date,
  contact_name text not null check (char_length(contact_name) between 2 and 120),
  contact_phone text check (char_length(contact_phone) <= 40),
  contact_email text not null check (char_length(contact_email) <= 200),
  status text not null default 'new' check (status in
    ('new','analyzing','info_required','quote_sent','accepted','in_progress','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index service_requests_user_idx on public.service_requests(user_id, created_at desc);
create index service_requests_status_idx on public.service_requests(status, created_at desc);
create trigger service_requests_updated before update on public.service_requests
  for each row execute function public.set_updated_at();

create table public.service_request_history (
  id bigint generated always as identity primary key,
  request_id uuid not null references public.service_requests(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  from_status text,
  to_status text not null,
  created_at timestamptz not null default now()
);
create index request_history_idx on public.service_request_history(request_id, created_at);

create table public.request_notes (   -- notes internes : jamais visibles du client
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  author_id uuid references auth.users(id) on delete set null,
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index request_notes_idx on public.request_notes(request_id, created_at);

create table public.request_attachments (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.service_requests(id) on delete cascade,
  storage_path text not null,
  file_name text not null check (char_length(file_name) <= 200),
  mime_type text,
  size_bytes integer check (size_bytes between 0 and 10485760),
  created_at timestamptz not null default now()
);
create index request_attachments_idx on public.request_attachments(request_id);

-- ---------- Messagerie ----------
create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null unique references public.service_requests(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  last_message_at timestamptz,
  created_at timestamptz not null default now()
);
create index conversations_user_idx on public.conversations(user_id);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  is_staff boolean not null default false,
  body text not null check (char_length(body) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index messages_conv_idx on public.messages(conversation_id, created_at);

-- ---------- Messages de contact (formulaire public) ----------
create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 120),
  email text not null check (char_length(email) between 5 and 200),
  phone text check (char_length(phone) <= 40),
  subject text check (char_length(subject) <= 150),
  message text not null check (char_length(message) between 5 and 4000),
  status text not null default 'new' check (status in ('new','read','replied','archived')),
  created_at timestamptz not null default now()
);
create index contact_messages_idx on public.contact_messages(status, created_at desc);

-- ---------- Triggers métier ----------
create or replace function public.on_request_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.conversations(request_id, user_id) values (new.id, new.user_id);
  insert into public.service_request_history(request_id, actor_id, from_status, to_status)
    values (new.id, new.user_id, null, new.status);
  perform public.notify_staff('requests.view', 'new_request', 'Nouvelle demande ' || new.reference,
    new.project_name || ' — ' || new.service_name, '/admin/requests/' || new.id,
    jsonb_build_object('request_id', new.id));
  insert into public.notifications(user_id, type, title, body, link, data)
    values (new.user_id, 'request_received', 'Demande reçue ' || new.reference,
      'Nous avons bien reçu votre demande « ' || new.project_name || ' ».',
      '/account/requests/' || new.id, jsonb_build_object('request_id', new.id));
  return new;
end $$;
create trigger service_requests_created after insert on public.service_requests
  for each row execute function public.on_request_created();

create or replace function public.on_request_status_changed()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.service_request_history(request_id, actor_id, from_status, to_status)
      values (new.id, auth.uid(), old.status, new.status);
    if auth.uid() is distinct from new.user_id then
      insert into public.notifications(user_id, type, title, body, link, data)
        values (new.user_id, 'status_changed', 'Demande ' || new.reference || ' mise à jour',
          'Nouveau statut : ' || new.status, '/account/requests/' || new.id,
          jsonb_build_object('request_id', new.id, 'status', new.status));
    else
      perform public.notify_staff('requests.view', 'request_updated', 'Demande ' || new.reference || ' modifiée',
        'Statut : ' || new.status, '/admin/requests/' || new.id,
        jsonb_build_object('request_id', new.id), new.user_id);
    end if;
  end if;
  return new;
end $$;
create trigger service_requests_status after update of status on public.service_requests
  for each row execute function public.on_request_status_changed();

create or replace function public.on_message_created()
returns trigger language plpgsql security definer set search_path = public as $$
declare conv public.conversations; req public.service_requests;
begin
  select * into conv from public.conversations where id = new.conversation_id;
  select * into req from public.service_requests where id = conv.request_id;
  update public.conversations set last_message_at = new.created_at where id = conv.id;
  if new.is_staff then
    insert into public.notifications(user_id, type, title, body, link, data)
      values (conv.user_id, 'reply', 'Nouvelle réponse — ' || req.reference,
        left(new.body, 140), '/account/requests/' || req.id,
        jsonb_build_object('request_id', req.id, 'message_id', new.id));
  else
    perform public.notify_staff('messages.reply', 'new_message', 'Nouveau message — ' || req.reference,
      left(new.body, 140), '/admin/requests/' || req.id,
      jsonb_build_object('request_id', req.id, 'message_id', new.id), new.sender_id);
  end if;
  return new;
end $$;
create trigger messages_created after insert on public.messages
  for each row execute function public.on_message_created();

create or replace function public.on_contact_created()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.notify_staff('contact.manage', 'contact_message', 'Nouveau message de contact',
    new.name || ' — ' || coalesce(nullif(new.subject,''), left(new.message, 80)), '/admin/contact',
    jsonb_build_object('contact_id', new.id));
  return new;
end $$;
create trigger contact_created after insert on public.contact_messages
  for each row execute function public.on_contact_created();

-- Marquer les messages de l'autre partie comme lus
create or replace function public.mark_messages_read(p_conversation uuid)
returns void language plpgsql security definer set search_path = public as $$
declare conv public.conversations;
begin
  select * into conv from public.conversations where id = p_conversation;
  if conv.id is null then return; end if;
  if conv.user_id = auth.uid() then
    update public.messages set read_at = now()
      where conversation_id = p_conversation and is_staff and read_at is null;
  elsif public.has_perm('requests.view') then
    update public.messages set read_at = now()
      where conversation_id = p_conversation and not is_staff and read_at is null;
  end if;
end $$;
revoke all on function public.mark_messages_read(uuid) from public, anon;
grant execute on function public.mark_messages_read(uuid) to authenticated;
