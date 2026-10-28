import Link from 'next/link';
import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { getDict, statusLabel } from '@/i18n';
import { createClient } from '@/lib/supabase/server';
import { Chat } from '@/components/Chat';
import { cancelRequest } from './actions';

export const dynamic = 'force-dynamic';
const CANCELLABLE = ['new', 'analyzing', 'info_required', 'quote_sent'];

export default async function RequestDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const a = await requireUser(`/account/requests/${id}`); const { t } = await getDict();
  const supabase = await createClient();
  const { data: r } = await supabase.from('service_requests').select('*').eq('id', id).eq('user_id', a.user.id).maybeSingle();
  if (!r) notFound();   // la demande d'un autre client est invisible (RLS) et renvoie 404
  const [{ data: hist }, { data: conv }, { data: atts }] = await Promise.all([
    supabase.from('service_request_history').select('to_status,created_at').eq('request_id', id).order('created_at'),
    supabase.from('conversations').select('id').eq('request_id', id).maybeSingle(),
    supabase.from('request_attachments').select('id,file_name,storage_path').eq('request_id', id),
  ]);
  const msgs = conv ? (await supabase.from('messages').select('id,sender_id,is_staff,body,created_at,read_at').eq('conversation_id', conv.id).order('created_at')).data ?? [] : [];
  const links = await Promise.all((atts ?? []).map(async (x) => ({ ...x, url: (await supabase.storage.from('request-attachments').createSignedUrl(x.storage_path, 300)).data?.signedUrl })));
  return (
    <div className="space-y-6">
      <Link href="/account/requests" className="text-sm text-neutral-500 hover:text-brand">← {t.account.requests}</Link>
      <div className="rounded-2xl border border-neutral-200 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><h2 className="text-xl font-bold">{r.project_name}</h2><p className="text-sm text-neutral-500">{t.account.reference} {r.reference} · {r.service_name}</p></div>
          <span className="rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">{statusLabel(t, r.status)}</span>
        </div>
        <p className="mt-4 whitespace-pre-line text-sm text-neutral-700">{r.description}</p>
        <p className="mt-3 text-xs text-neutral-500">{r.country}{r.city ? `, ${r.city}` : ''}{r.budget_amount ? ` · ${r.budget_amount} ${r.budget_currency ?? ''}` : ''}{r.desired_date ? ` · ${r.desired_date}` : ''}</p>
        {links.length > 0 && <ul className="mt-3 space-y-1 text-sm">{links.map((l) => <li key={l.id}>{l.url ? <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-brand underline">{l.file_name}</a> : l.file_name}</li>)}</ul>}
        {CANCELLABLE.includes(r.status) && (
          <form action={cancelRequest} className="mt-4"><input type="hidden" name="id" value={r.id} />
            <button className="min-h-10 rounded-xl border border-red-300 px-4 text-sm font-semibold text-red-700" >{t.account.cancel}</button></form>)}
      </div>
      <section><h3 className="font-bold">{t.account.history}</h3>
        <ol className="mt-3 space-y-2 border-l-2 border-neutral-200 pl-4 text-sm">{(hist ?? []).map((h, i) => (
          <li key={i}><span className="font-medium">{statusLabel(t, h.to_status)}</span> <span className="text-neutral-400">· {new Date(h.created_at).toLocaleString('fr-FR')}</span></li>))}</ol></section>
      {conv && <Chat conversationId={conv.id} userId={a.user.id} asStaff={false} initial={msgs}
        labels={{ placeholder: t.account.writeMessage, send: t.account.send, empty: '—', title: t.account.messages }} />}
    </div>
  );
}
