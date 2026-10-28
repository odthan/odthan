import { NextResponse, type NextRequest } from 'next/server';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { SITE_URL } from '@/lib/env';

/** Reçoit les liens de confirmation d'e-mail et de réinitialisation de mot de passe envoyés par Supabase. */
export async function GET(req: NextRequest) {
  const url = req.nextUrl;
  const next = url.searchParams.get('next') ?? '/account';
  const safe = next.startsWith('/') && !next.startsWith('//') ? next : '/account';
  const supabase = await createClient();
  let ok = false;
  const code = url.searchParams.get('code');
  const token_hash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type') as EmailOtpType | null;
  if (code) ok = !(await supabase.auth.exchangeCodeForSession(code)).error;
  else if (token_hash && type) ok = !(await supabase.auth.verifyOtp({ type, token_hash })).error;
  return NextResponse.redirect(new URL(ok ? safe : '/login?error=link', SITE_URL));
}
