'use client';
import { createBrowserClient } from '@supabase/ssr';
import { SUPABASE_ANON, SUPABASE_URL } from '@/lib/env';
let c: ReturnType<typeof createBrowserClient> | null = null;
export function createClient() {
  if (!c) c = createBrowserClient(SUPABASE_URL, SUPABASE_ANON);
  return c;
}
