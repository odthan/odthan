-- ODTHAN — 005 : stockage (images publiques, pièces jointes privées)

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values
  ('service-media',  'service-media',  true,  2097152, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('category-media', 'category-media', true,  2097152, array['image/jpeg','image/png','image/webp','image/svg+xml']),
  ('request-attachments', 'request-attachments', false, 5242880,
     array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = excluded.public,
  file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

-- Images publiques : lecture via URL publique (bucket public) ; écriture réservée aux rôles autorisés.
create policy "service media write" on storage.objects for insert to authenticated
  with check (bucket_id = 'service-media' and public.has_perm('services.manage'));
create policy "service media update" on storage.objects for update to authenticated
  using (bucket_id = 'service-media' and public.has_perm('services.manage'));
create policy "service media delete" on storage.objects for delete to authenticated
  using (bucket_id = 'service-media' and public.has_perm('services.manage'));

create policy "category media write" on storage.objects for insert to authenticated
  with check (bucket_id = 'category-media' and public.has_perm('categories.manage'));
create policy "category media update" on storage.objects for update to authenticated
  using (bucket_id = 'category-media' and public.has_perm('categories.manage'));
create policy "category media delete" on storage.objects for delete to authenticated
  using (bucket_id = 'category-media' and public.has_perm('categories.manage'));

-- Pièces jointes privées : dossier = identifiant de l'utilisateur ; accès via URL signée temporaire.
create policy "attachments insert own" on storage.objects for insert to authenticated
  with check (bucket_id = 'request-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "attachments select own or staff" on storage.objects for select to authenticated
  using (bucket_id = 'request-attachments'
         and ((storage.foldername(name))[1] = auth.uid()::text or public.has_perm('requests.view')));
create policy "attachments delete own" on storage.objects for delete to authenticated
  using (bucket_id = 'request-attachments' and (storage.foldername(name))[1] = auth.uid()::text);
