import { requireUser } from '@/lib/auth';
import { getDict } from '@/i18n';
import { createClient } from '@/lib/supabase/server';
import { ProfileForm, DeleteAccountForm } from './ProfileForm';

export const dynamic = 'force-dynamic';
export default async function ProfilePage() {
  const a = await requireUser('/account/profile'); const { t } = await getDict();
  const { data: p } = await createClient().then((s) => s.from('profiles').select('*').eq('id', a.user.id).maybeSingle());
  return (
    <div className="max-w-lg space-y-10">
      <ProfileForm t={t} email={a.user.email ?? ''} p={{ full_name: p?.full_name ?? '', phone: p?.phone ?? '', country: p?.country ?? '', city: p?.city ?? '', preferred_language: p?.preferred_language ?? 'fr' }} />
      <DeleteAccountForm t={t} requested={Boolean(p?.deletion_requested_at)} />
    </div>
  );
}
