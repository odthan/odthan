import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getDict } from '@/i18n';
import { getAccess } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { getPublicService } from '@/lib/data';
import { RequestForm } from './RequestForm';

export const dynamic = 'force-dynamic';
export default async function NewRequest({ searchParams }: { searchParams: Promise<{ service?: string }> }) {
  const { t } = await getDict();
  const slug = (await searchParams).service ?? '';
  const a = await getAccess();
  if (!a.user) return (
    <div className="mx-auto max-w-md px-4 py-16 text-center"><p className="text-lg font-semibold">{t.request.loginRequired}</p>
      <div className="mt-6 flex flex-col gap-3"><Link href={`/login?next=${encodeURIComponent(`/account/requests/new?service=${slug}`)}`} className="min-h-12 rounded-xl bg-brand py-3 font-semibold text-white">{t.nav.login}</Link>
        <Link href="/register" className="min-h-12 rounded-xl border py-3 font-semibold">{t.nav.register}</Link></div></div>);
  const s = await getPublicService(slug);
  if (!s) redirect('/#services');
  if (!s.allow_requests) return <div className="py-16 text-center text-neutral-600">{t.request.unavailable}</div>;
  const { data: p } = await (await createClient()).from('profiles').select('full_name,phone,country,city').eq('id', a.user.id).maybeSingle();
  return (
    <div className="max-w-xl">
      <h2 className="text-xl font-bold">{t.request.title}</h2>
      <RequestForm t={t} service={{ id: s.id, name: s.name }} defaults={{ name: p?.full_name ?? '', email: a.user.email ?? '', phone: p?.phone ?? '', country: p?.country ?? '', city: p?.city ?? '' }} userId={a.user.id} />
    </div>
  );
}
