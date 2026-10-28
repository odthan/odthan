import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getDict, statusLabel } from '@/i18n';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export default async function AccountHome() {
  const a = await requireUser('/account'); const { t } = await getDict();
  const supabase = await createClient();
  const [{ data: profile }, { data: reqs }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', a.user.id).maybeSingle(),
    supabase.from('service_requests').select('id,reference,project_name,status,created_at').order('created_at', { ascending: false }).limit(5),
  ]);
  return (
    <div className="space-y-6">
      <p className="text-lg">{profile?.full_name ?? a.user.email}</p>
      <section>
        <div className="flex items-center justify-between"><h2 className="font-bold">{t.account.requests}</h2><Link href="/#services" className="text-sm font-semibold text-brand">{t.services.title} →</Link></div>
        {(reqs ?? []).length === 0 ? <p className="mt-3 rounded-2xl border border-dashed border-neutral-300 p-6 text-center text-sm text-neutral-500">{t.account.noRequests}</p> : (
          <ul className="mt-3 divide-y rounded-2xl border border-neutral-200">
            {reqs!.map((r) => (<li key={r.id}><Link href={`/account/requests/${r.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-mist">
              <span className="min-w-0"><span className="block truncate font-semibold">{r.project_name}</span><span className="text-xs text-neutral-500">{r.reference}</span></span>
              <span className="shrink-0 rounded-full bg-mist px-3 py-1 text-xs font-medium">{statusLabel(t, r.status)}</span></Link></li>))}
          </ul>)}
      </section>
    </div>
  );
}
