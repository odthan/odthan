import { createServerClient } from '@supabase/ssr';
import { createClient as createJsClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { SUPABASE_ANON, SUPABASE_URL } from '@/lib/env';

/** Client lié à la session de l'utilisateur : toutes les requêtes passent par RLS. */
export async function createClient() {
  const store = await cookies();
  return createServerClient(SUPABASE_URL, SUPABASE_ANON, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try { list.forEach(({ name, value, options }) => store.set(name, value, options)); } catch { /* Server Component */ }
      },
    },
  });
}

/** Client service role : SERVEUR UNIQUEMENT, contourne RLS. À n'utiliser qu'après vérification des droits. */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY manquante');
  return createJsClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
