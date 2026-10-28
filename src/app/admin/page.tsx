import { checkPerm } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, Empty, Forbidden, PageHead } from '@/components/admin-ui';
import { setContactStatus } from '../actions';

export const metadata = { title: 'Messages de contact' };
const L: Record<string, string> = { new: 'Nouveau', read: 'Lu', replied: 'Répondu', archived: 'Archivé' };
export default async function ContactAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  if (!(await checkPerm('contact.manage'))) return <Forbidden />;
  const sp = await searchParams; let q = (await createClient()).from('contact_messages').select('*').order('created_at', { ascending: false }).limit(200);
  if (sp.status && L[sp.status]) q = q.eq('status', sp.status);
  const { data } = await q;
  return (
    <>
      <PageHead title="Messages de contact" sub="Messages envoyés depuis le formulaire public. Les messages WhatsApp restent dans WhatsApp." />
      <div className="mb-4 flex flex-wrap gap-2 text-sm">{[['', 'Tous'], ...Object.entries(L)].map(([k, v]) => <a key={k} href={k ? `?status=${k}` : '?'} className={`rounded-full border px-4 py-2 font-medium ${(sp.status ?? '') === k ? 'bg-ink text-white' : ''}`}>{v}</a>)}</div>
      {(data ?? []).length === 0 ? <Empty>Aucun message.</Empty> : <ul className="space-y-3">{data!.map((m) => (
        <li key={m.id}><Card><div className="flex items-start justify-between gap-2"><div><p className="font-bold">{m.name} <span className="font-normal text-neutral-500">— {m.subject || 'Sans sujet'}</span></p>
          <p className="text-xs text-neutral-500"><a className="text-brand" href={`mailto:${m.email}`}>{m.email}</a>{m.phone ? ` · ${m.phone}` : ''} · {new Date(m.created_at).toLocaleString('fr-FR')}</p></div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${m.status === 'new' ? 'bg-brand text-white' : 'bg-neutral-100'}`}>{L[m.status]}</span></div>
          <p className="mt-3 whitespace-pre-line text-sm">{m.message}</p>
          <form action={setContactStatus} className="mt-3 flex gap-2"><input type="hidden" name="id" value={m.id} />
            {Object.entries(L).filter(([k]) => k !== m.status).map(([k, v]) => <button key={k} name="status" value={k} className="min-h-10 rounded-lg border px-3 text-sm font-medium">{v}</button>)}</form></Card></li>))}</ul>}
    </>
  );
}
