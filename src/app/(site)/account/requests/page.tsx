import Link from 'next/link';
import { requireUser } from '@/lib/auth';
import { getDict, statusLabel } from '@/i18n';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';
export default async function RequestsPage() {
  await requireUser('/account/requests'); const { t } = await getDict();
  const { data } = await (await createClient()).from('service_requests').select('id,reference,project_name,service_name,status,created_at').order('created_at', { ascending: false });
  return (
    <div>
      <h2 className="font-bold">{t.account.requests}</h2>
      {(data ?? []).length === 0 ? <p className="mt-4 rounded-2xl border border-dashed p-8 text-center text-sm text-neutral-500">{t.account.noRequests}<br /><Link href="/#services" className="mt-2 inline-block font-semibold text-brand">{t.services.title}</Link></p> : (
        <ul className="mt-4 divide-y rounded-2xl border border-neutral-200">
          {data!.map((r) => (<li key={r.id}><Link href={`/account/requests/${r.id}`} className="flex items-center justify-between gap-3 p-4 hover:bg-mist">
            <span className="min-w-0"><span className="block truncate font-semibold">{r.project_name}</span><span className="text-xs text-neutral-500">{r.reference} · {r.service_name} · {new Date(r.created_at).toLocaleDateString('fr-FR')}</span></span>
            <span className="shrink-0 rounded-full bg-mist px-3 py-1 text-xs font-medium">{statusLabel(t, r.status)}</span></Link></li>))}
        </ul>)}
    </div>
  );
}
