#!/usr/bin/env python3
"""Teste migrations + RLS sur un PostgreSQL local avec un faux schéma auth/storage (tests/mock_supabase.sql).
Usage : PGHOST=/tmp/pg PGPORT=5433 PGUSER=postgres python3 tests/rls_test.py"""
import subprocess, sys, os
DB = os.environ.get('TESTDB', 't')
U = dict(super='11111111-1111-1111-1111-111111111111', a='22222222-2222-2222-2222-222222222222',
         b='33333333-3333-3333-3333-333333333333', support='44444444-4444-4444-4444-444444444444',
         admin='55555555-5555-5555-5555-555555555555', editor='66666666-6666-6666-6666-666666666666')
def psql(sql, role=None, uid=None, commit=False):
    pre = f"set local role {role}; select set_config('request.jwt.claim.sub','{uid or ''}',true);" if role else ''
    full = f"begin; {pre} {sql}; {'commit' if commit else 'rollback'};"
    p = subprocess.run(['psql', '-d', DB, '-At', '-q', '-v', 'ON_ERROR_STOP=1', '-c', full], capture_output=True, text=True)
    return p.returncode, (p.stdout + p.stderr).strip()
fails = 0; total = 0
def check(name, sql, role=None, uid=None, expect=None, error=None, commit=False):
    global fails, total; total += 1
    rc, out = psql(sql, role, uid, commit)
    lines = [l for l in out.splitlines() if l and l not in ('BEGIN','ROLLBACK','COMMIT','SET') and not l.startswith(('INSERT','UPDATE','DELETE'))]
    last = lines[-1] if lines else ''
    if error is not None: ok = rc != 0 and error.lower() in out.lower()
    else: ok = rc == 0 and (expect is None or last == str(expect))
    print(('PASS' if ok else 'FAIL'), '-', name, '' if ok else f'\n   attendu={error or expect!r} obtenu={out[-300:]!r}')
    if not ok: fails += 1
def setup(sql):
    rc, out = psql(sql, commit=True)
    if rc: print('SETUP ERROR', out); sys.exit(2)

# ---------- préparation ----------
setup("delete from auth.users")
for k, v in U.items():
    setup(f"insert into auth.users(id,email,email_confirmed_at) values ('{v}','{k}@test.local', now())")
setup("select public.bootstrap_super_admin('super@test.local')")
check('bootstrap refusé si un SUPER_ADMIN existe', "select public.bootstrap_super_admin('a@test.local')", error='existe déjà')
setup(f"insert into public.user_roles(user_id,role) values ('{U['support']}','SUPPORT'),('{U['admin']}','ADMIN'),('{U['editor']}','EDITOR')")
svc = "(select id from public.services where slug='konstrival')"

# ---------- anonyme ----------
check('anon voit les 2 services publiés', "select count(*) from public.services", 'anon', None, expect=2)
check('anon ne lit pas les profils', "select count(*) from public.profiles", 'anon', None, error='permission denied')
check('anon ne lit pas les demandes', "select count(*) from public.service_requests", 'anon', None, error='permission denied')
check('anon ne lit pas les messages de contact', "select count(*) from public.contact_messages", 'anon', None, error='permission denied')
check('anon ne peut pas écrire un contact directement', "insert into public.contact_messages(name,email,message) values ('x','x@x.fr','bonjour')", 'anon', None, error='permission denied')
check('anon ne peut pas insérer dans analytics', "insert into public.analytics_events(event_type) values ('page_view')", 'anon', None, error='permission denied')
check('anon lit les paramètres publics', "select count(*) > 0 from public.site_settings", 'anon', None, expect='t')
check('anon voit 6 catégories actives', "select count(*) from public.service_categories", 'anon', None, expect=6)

# ---------- brouillons / dépublication / catégorie désactivée ----------
setup(f"insert into public.services(slug,name,short_description,status) values ('brouillon','Brouillon','desc brouillon','draft')")
check('anon ne voit pas les brouillons', "select count(*) from public.services where slug='brouillon'", 'anon', None, expect=0)
check('éditeur voit les brouillons', "select count(*) from public.services where slug='brouillon'", 'authenticated', U['editor'], expect=1)
check('client A ne voit pas les brouillons', "select count(*) from public.services where slug='brouillon'", 'authenticated', U['a'], expect=0)
check('désactivation catégorie masque ses services publiquement',
      "update public.service_categories set is_active=false where slug='construction'; set local role anon; select count(*) from public.services where slug='konstrival'", expect=0)
setup("update public.service_categories set is_active=true where slug='construction'")
check('dépublier : service invisible pour anon', "update public.services set status='unpublished' where slug='odthan-business'; reset role; set local role anon; select count(*) from public.services where slug='odthan-business'", 'authenticated', U['editor'], expect=0)
check('client ne peut pas modifier un service', "update public.services set name='HACK' where slug='konstrival'; select count(*) from public.services where name='HACK'", 'authenticated', U['a'], expect=0)
check('client ne peut pas créer un service', "insert into public.services(slug,name,short_description) values ('x1','xx','xxxxx')", 'authenticated', U['a'], error='row-level security')
check('éditeur peut créer un service', "insert into public.services(slug,name,short_description) values ('x1','xx','xxxxx')", 'authenticated', U['editor'])
check('URL non http refusée', "insert into public.services(slug,name,short_description,official_url) values ('x2','xx','xxxxx','javascript:alert(1)')", 'authenticated', U['editor'], error='violates check')

# ---------- demandes ----------
ins = lambda uid, extra='': f"insert into public.service_requests(user_id,service_id,service_name,project_name,description,country,contact_name,contact_email{extra}) values ('{uid}',{svc},'FAUX NOM','Projet carrelage','Je veux poser du carrelage','Haïti','Client A','a@test.local'"
check('client A crée une demande (service_name forcé côté base)', ins(U['a']) + ") returning service_name", 'authenticated', U['a'], expect='KONSTRIVAL')
check('client A ne peut pas créer au nom de B', ins(U['b']) + ")", 'authenticated', U['a'], error='row-level security')
check('client ne peut pas choisir le statut', ins(U['a'], ',status') + ",'completed')", 'authenticated', U['a'], error='permission denied')
check('demande sur service dépublié refusée', ins(U['a']).replace(svc, "(select id from public.services where slug='brouillon')") + ")", 'authenticated', U['a'], error='accepte pas')
setup(ins(U['a']) + ")")  # persistée
check('une conversation est créée automatiquement', "select count(*) from public.conversations", expect=1)
check('l\'historique contient le statut initial', "select count(*) from public.service_request_history", expect=1)
check('super admin, admin et support sont notifiés (requests.view)', "select count(*) from public.notifications where type='new_request'", expect=3)
check('le client reçoit un accusé', "select count(*) from public.notifications where type='request_received' and user_id='%s'" % U['a'], expect=1)
check('client A voit sa demande', "select count(*) from public.service_requests", 'authenticated', U['a'], expect=1)
check('client B ne voit pas la demande de A', "select count(*) from public.service_requests", 'authenticated', U['b'], expect=0)
check('client B ne voit pas la conversation de A', "select count(*) from public.conversations", 'authenticated', U['b'], expect=0)
check('client B ne voit pas l\'historique de A', "select count(*) from public.service_request_history", 'authenticated', U['b'], expect=0)
check('client B ne peut pas annuler la demande de A', "update public.service_requests set status='cancelled'; select count(*) from public.service_requests where status='cancelled'", 'authenticated', U['b'], expect=0)
check('support voit la demande', "select count(*) from public.service_requests", 'authenticated', U['support'], expect=1)
check('support ne peut pas changer le statut (pas requests.manage)', "update public.service_requests set status='analyzing'; select count(*) from public.service_requests where status='analyzing'", 'authenticated', U['support'], expect=0)
check('super admin change le statut', "update public.service_requests set status='analyzing'; select count(*) from public.service_requests where status='analyzing'", 'authenticated', U['super'], expect=1)
setup(f"update public.service_requests set status='info_required'")  # postgres : actor null != owner → notifie le client
check('changement de statut notifie le client', "select count(*) from public.notifications where type='status_changed' and user_id='%s'" % U['a'], expect=1)
check('historique mis à jour', "select count(*) from public.service_request_history", expect=2)
check('client A ne peut pas mettre autre chose que annulée', "update public.service_requests set status='completed'", 'authenticated', U['a'], error='row-level security')
check('client A peut annuler sa demande', "update public.service_requests set status='cancelled'; select count(*) from public.service_requests where status='cancelled'", 'authenticated', U['a'], expect=1)
check('client A ne peut pas modifier le projet (colonne)', "update public.service_requests set project_name='x'", 'authenticated', U['a'], error='permission denied')

# ---------- notes internes ----------
rid = "(select id from public.service_requests limit 1)"
check('super admin ajoute une note interne', f"insert into public.request_notes(request_id,author_id,body) values ({rid},'{U['super']}','note privée')", 'authenticated', U['super'])
setup(f"insert into public.request_notes(request_id,author_id,body) values ({rid},'{U['super']}','note privée')")
check('le client ne voit AUCUNE note interne', "select count(*) from public.request_notes", 'authenticated', U['a'], expect=0)
check('support voit les notes', "select count(*) from public.request_notes", 'authenticated', U['support'], expect=1)
check('support ne peut pas écrire de note (pas requests.manage)', f"insert into public.request_notes(request_id,author_id,body) values ({rid},'{U['support']}','x')", 'authenticated', U['support'], error='row-level security')

# ---------- messagerie ----------
conv = "(select id from public.conversations limit 1)"
check('client A écrit dans sa conversation', f"insert into public.messages(conversation_id,sender_id,body) values ({conv},'{U['a']}','Bonjour')", 'authenticated', U['a'])
setup(f"insert into public.messages(conversation_id,sender_id,body) values ({conv},'{U['a']}','Bonjour')")
check('client B ne peut pas écrire dans la conversation de A', f"insert into public.messages(conversation_id,sender_id,body) values ({conv},'{U['b']}','intrus')", 'authenticated', U['b'], error='row-level security')
check('client A ne peut pas se faire passer pour le staff', f"insert into public.messages(conversation_id,sender_id,body,is_staff) values ({conv},'{U['a']}','faux staff',true)", 'authenticated', U['a'], error='row-level security')
check('client B ne lit pas les messages de A', "select count(*) from public.messages", 'authenticated', U['b'], expect=0)
check('support est notifié du message client', "select count(*) from public.notifications where type='new_message' and user_id='%s'" % U['support'], expect=1)
check('support répond', f"insert into public.messages(conversation_id,sender_id,body,is_staff) values ({conv},'{U['support']}','Réponse',true)", 'authenticated', U['support'])
setup(f"insert into public.messages(conversation_id,sender_id,body,is_staff) values ({conv},'{U['support']}','Réponse',true)")
check('client A est notifié de la réponse', "select count(*) from public.notifications where type='reply' and user_id='%s'" % U['a'], expect=1)
check('client A marque la réponse comme lue', f"select public.mark_messages_read({conv}); select count(*) from public.messages where is_staff and read_at is not null", 'authenticated', U['a'], expect=1)
check('client B ne peut pas marquer lu la conversation de A', f"select public.mark_messages_read({conv}); select count(*) from public.messages where read_at is not null", 'authenticated', U['b'], expect=0)

# ---------- notifications ----------
check('client B ne voit pas les notifications de A', "select count(*) from public.notifications", 'authenticated', U['b'], expect=0)
check('client A ne peut pas modifier le titre', "update public.notifications set title='x'", 'authenticated', U['a'], error='permission denied')
check('client A peut marquer lu', "update public.notifications set read_at=now() where read_at is null; select count(*) from public.notifications where read_at is null", 'authenticated', U['a'], expect=0)
check('client ne peut pas insérer une notification', f"insert into public.notifications(user_id,type,title) values ('{U['a']}','x','x')", 'authenticated', U['a'], error='permission denied')
check('abonnement push de A invisible pour B', f"insert into public.push_subscriptions(user_id,endpoint,p256dh,auth) values ('{U['a']}','https://e/1','k','a'); reset role; set local role authenticated; select set_config('request.jwt.claim.sub','{U['b']}',true); select count(*) from public.push_subscriptions", 'authenticated', U['a'], expect=0)
check('B ne peut pas créer un abonnement au nom de A', f"insert into public.push_subscriptions(user_id,endpoint,p256dh,auth) values ('{U['a']}','https://e/2','k','a')", 'authenticated', U['b'], error='row-level security')

# ---------- rôles ----------
check('client ne peut pas s\'attribuer un rôle', f"insert into public.user_roles(user_id,role) values ('{U['a']}','SUPER_ADMIN')", 'authenticated', U['a'], error='Permission refusée')
check('client ne voit pas les rôles des autres', "select count(*) from public.user_roles", 'authenticated', U['a'], expect=0)
check('support ne peut pas gérer les rôles', f"insert into public.user_roles(user_id,role) values ('{U['a']}','SUPPORT')", 'authenticated', U['support'], error='Permission refusée')
check('ADMIN ne peut pas créer un SUPER_ADMIN', f"insert into public.user_roles(user_id,role) values ('{U['a']}','SUPER_ADMIN')", 'authenticated', U['admin'], error='Seul un SUPER_ADMIN')
check('ADMIN ne peut pas créer un ADMIN', f"insert into public.user_roles(user_id,role) values ('{U['a']}','ADMIN')", 'authenticated', U['admin'], error='Seul un SUPER_ADMIN')
check('ADMIN peut créer un MANAGER', f"insert into public.user_roles(user_id,role) values ('{U['a']}','MANAGER')", 'authenticated', U['admin'])
check('ADMIN ne peut pas modifier ses propres rôles', f"insert into public.user_roles(user_id,role) values ('{U['admin']}','SUPPORT')", 'authenticated', U['admin'], error='propres rôles')
check('SUPER_ADMIN peut créer un ADMIN', f"insert into public.user_roles(user_id,role) values ('{U['a']}','ADMIN')", 'authenticated', U['super'])
check('le dernier SUPER_ADMIN ne peut pas être retiré', f"delete from public.user_roles where role='SUPER_ADMIN'", error='dernier SUPER_ADMIN')
check('rôle inconnu refusé', f"insert into public.user_roles(user_id,role) values ('{U['a']}','ROOT')", error='violates check')

# ---------- profils ----------
check('client voit uniquement son profil', "select count(*) from public.profiles", 'authenticated', U['a'], expect=1)
check('admin voit tous les profils', "select count(*) from public.profiles", 'authenticated', U['admin'], expect=6)
check('client modifie son nom', "update public.profiles set full_name='Nouveau'", 'authenticated', U['a'])
check('client ne peut pas modifier l\'e-mail du profil', "update public.profiles set email='x@x.fr'", 'authenticated', U['a'], error='permission denied')
check('client ne peut pas modifier le profil d\'un autre', f"update public.profiles set full_name='HACK' where id='{U['b']}'; select count(*) from public.profiles where full_name='HACK'", 'authenticated', U['a'], expect=0)

# ---------- paramètres, journal, analytique, contact ----------
check('client ne peut pas modifier les paramètres', "update public.site_settings set value='{}'; select count(*) from public.site_settings where value='{}'::jsonb", 'authenticated', U['a'], expect=0)
check('super admin modifie les paramètres', "update public.site_settings set value='{\"x\":1}' where key='locale'; select count(*) from public.site_settings where value='{\"x\":1}'::jsonb", 'authenticated', U['super'], expect=1)
check('éditeur ne peut pas modifier les paramètres', "update public.site_settings set value='{\"y\":1}'; select count(*) from public.site_settings where value='{\"y\":1}'::jsonb", 'authenticated', U['editor'], expect=0)
check('client ne peut pas écrire dans le journal', f"insert into public.admin_activity_logs(actor_id,action) values ('{U['a']}','x')", 'authenticated', U['a'], error='row-level security')
check('staff écrit dans le journal', f"insert into public.admin_activity_logs(actor_id,action) values ('{U['editor']}','service.create')", 'authenticated', U['editor'])
check('éditeur ne lit pas le journal', "select count(*) from public.admin_activity_logs", 'authenticated', U['editor'], expect=0)
setup("insert into public.analytics_events(event_type,path,session_id,visitor_id,device,service_id) values ('page_view','/','s1','v1','mobile',null),('service_view','/services/konstrival','s1','v1','mobile',(select id from public.services where slug='konstrival'))")
check('client ne peut pas appeler analytics_summary', "select public.analytics_summary(now()-interval '1 day', now()+interval '1 day')", 'authenticated', U['a'], error='Permission refusée')
check('anon ne peut pas appeler analytics_summary', "select public.analytics_summary(now()-interval '1 day', now()+interval '1 day')", 'anon', None, error='permission denied')
check('admin lit analytics_summary (1 visiteur, 1 page vue)', "select (public.analytics_summary(now()-interval '1 day', now()+interval '1 day')->>'visitors') || '/' || (public.analytics_summary(now()-interval '1 day', now()+interval '1 day')->>'page_views')", 'authenticated', U['admin'], expect='1/1')
check('support peut lire les messages de contact', "select count(*) from public.contact_messages", 'authenticated', U['support'])
check('éditeur ne lit pas les contacts', "select count(*) from public.contact_messages", 'authenticated', U['editor'], expect=0)

# ---------- stockage ----------
check('client ne peut pas écrire dans service-media', "insert into storage.objects(bucket_id,name) values ('service-media','x.png')", 'authenticated', U['a'], error='row-level security')
check('éditeur écrit dans service-media', "insert into storage.objects(bucket_id,name) values ('service-media','x.png')", 'authenticated', U['editor'])
check('éditeur ne peut pas écrire dans category-media? (categories.manage oui)', "insert into storage.objects(bucket_id,name) values ('category-media','c.png')", 'authenticated', U['editor'])
check('support ne peut pas écrire dans category-media', "insert into storage.objects(bucket_id,name) values ('category-media','c.png')", 'authenticated', U['support'], error='row-level security')
check('client dépose une pièce jointe dans son dossier', f"insert into storage.objects(bucket_id,name) values ('request-attachments','{U['a']}/f.pdf')", 'authenticated', U['a'])
check('client ne peut pas déposer dans le dossier d\'un autre', f"insert into storage.objects(bucket_id,name) values ('request-attachments','{U['b']}/f.pdf')", 'authenticated', U['a'], error='row-level security')
setup(f"insert into storage.objects(bucket_id,name) values ('request-attachments','{U['a']}/f.pdf')")
check('client B ne voit pas les pièces jointes de A', "select count(*) from storage.objects where bucket_id='request-attachments'", 'authenticated', U['b'], expect=0)
check('client A voit sa pièce jointe', "select count(*) from storage.objects where bucket_id='request-attachments'", 'authenticated', U['a'], expect=1)
check('support voit les pièces jointes', "select count(*) from storage.objects where bucket_id='request-attachments'", 'authenticated', U['support'], expect=1)
check('buckets privé/publics configurés', "select string_agg(id||':'||public::text, ',' order by id) from storage.buckets", expect='category-media:true,request-attachments:false,service-media:true')
check('RLS activé sur toutes les tables public', "select count(*) from pg_tables where schemaname='public' and not rowsecurity", expect=0)

print(f"\n{total-fails}/{total} tests réussis"); sys.exit(1 if fails else 0)
