import Link from 'next/link';
import { notFound } from 'next/navigation';
import { checkPerm } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, Flash, Forbidden, Pill, STATUS_FR } from '@/components/admin-ui';
import { Chat } from '@/components/Chat';
import { addNote, updateRequestStatus } from '../../actions';

export default async function RequestAdmin({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ m?: string; e?: string }> }) {
  const a = await checkPerm('requests.view'); if (!a) return <Forbidden />;
  const { id } = await params; const sp = await searchParams; if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const { data: r } = await supabase.from('service_requests').select('*').eq('id', id).maybeSingle(); if (!r) notFound();
  const canManage = a.permissions.includes('requests.manage'); const canReply = a.permissions.includes('messages.reply');
  const [{ data: hist }, { data: notes }, { data: conv }, { data: atts }, { data: client }] = await Promise.all([
    supabase.from('service_request_history').select('from_status,to_status,created_at,actor_id').eq('request_id', id).order('created_at'),
    supabase.from('request_notes').select('id,body,created_at,author_id').eq('request_id', id).order('created_at', { ascending: false }),
    supabase.from('conversations').select('id').eq('request_id', id).maybeSingle(),
    supabase.from('request_attachments').select('id,file_name,storage_path').eq('request_id', id),
    supabase.from('profiles').select('full_name,email').eq('id', r.user_id).maybeSingle(),
  ]);
  const msgs = conv ? (await supabase.from('messages').select('id,sender_id,is_staff,body,created_at,read_at').eq('conversation_id', conv.id).order('created_at')).data ?? [] : [];
  const links = await Promise.all((atts ?? []).map(async (x) => ({ ...x, url: (await supabase.storage.from('request-attachments').createSignedUrl(x.storage_path, 300)).data?.signedUrl })));
  return (
    <div className="space-y-5">
      <Link href="/admin/requests" className="text-sm text-neutral-500 hover:text-brand">← Demandes</Link>
      <Flash m={sp.m} e={sp.e} />
      <Card>
        <div className="flex flex-wrap items-start justify-between gap-2"><div><h1 className="text-xl font-extrabold">{r.project_name}</h1><p className="text-sm text-neutral-500">{r.reference} · {r.service_name}</p></div><Pill s={r.status} /></div>
        <p className="mt-4 whitespace-pre-line text-sm">{r.description}</p>
        <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
          <div><dt className="text-neutral-500">Client</dt><dd className="font-medium">{r.contact_name} {client?.email && client.email !== r.contact_email ? `(compte : ${client.email})` : ''}</dd></div>
          <div><dt className="text-neutral-500">Contact</dt><dd className="font-medium"><a className="text-brand" href={`mailto:${r.contact_email}`}>{r.contact_email}</a>{r.contact_phone && <> · <a className="text-brand" href={`tel:${r.contact_phone}`}>{r.contact_phone}</a></>}</dd></div>
          <div><dt className="text-neutral-500">Lieu</dt><dd className="font-medium">{r.country}{r.city ? `, ${r.city}` : ''}</dd></div>
          <div><dt className="text-neutral-500">Budget / délai</dt><dd className="font-medium">{r.budget_amount ? `${r.budget_amount} ${r.budget_currency ?? ''}` : '—'} · {r.desired_date ?? '—'}</dd></div>
        </dl>
        {links.length > 0 && <ul className="mt-3 space-y-1 text-sm">{links.map((l) => <li key={l.id}>📎 {l.url ? <a href={l.url} target="_blank" rel="noopener noreferrer" className="text-brand underline">{l.file_name}</a> : l.file_name}</li>)}</ul>}
      </Card>
      {canManage && (
        <Card><h2 className="mb-2 font-bold">Statut</h2>
          <form action={updateRequestStatus} className="flex flex-col gap-2 sm:flex-row"><input type="hidden" name="id" value={r.id} />
            <select name="status" defaultValue={r.status} className="min-h-11 flex-1 rounded-xl border border-neutral-300 px-3 text-base sm:text-sm">{Object.entries(STATUS_FR).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            <button className="min-h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white">Mettre à jour</button></form></Card>)}
      {conv && canReply && <Chat conversationId={conv.id} userId={a.user.id} asStaff initial={msgs} labels={{ placeholder: 'Répondre au client…', send: 'Envoyer', empty: 'Aucun message.', title: 'Conversation avec le client' }} />}
      <Card><h2 className="font-bold">Notes internes <span className="text-xs font-normal text-neutral-500">(jamais visibles par le client)</span></h2>
        {canManage && <form action={addNote} className="mt-3 flex flex-col gap-2"><input type="hidden" name="id" value={r.id} /><textarea name="body" required maxLength={4000} rows={3} placeholder="Ajouter une note…" className="rounded-xl border border-neutral-300 px-3 py-2 text-base sm:text-sm" /><button className="min-h-11 self-start rounded-xl bg-ink px-5 text-sm font-semibold text-white">Ajouter la note</button></form>}
        <ul className="mt-3 space-y-2">{(notes ?? []).map((n) => <li key={n.id} className="rounded-xl bg-amber-50 p-3 text-sm"><p className="whitespace-pre-line">{n.body}</p><p className="mt-1 text-xs text-neutral-500">{new Date(n.created_at).toLocaleString('fr-FR')}</p></li>)}{(notes ?? []).length === 0 && <li className="text-sm text-neutral-500">Aucune note.</li>}</ul></Card>
      <Card><h2 className="font-bold">Historique</h2><ol className="mt-3 space-y-2 border-l-2 pl-4 text-sm">{(hist ?? []).map((h, i) => <li key={i}>{h.from_status ? `${STATUS_FR[h.from_status]} → ` : ''}<strong>{STATUS_FR[h.to_status]}</strong> <span className="text-neutral-400">· {new Date(h.created_at).toLocaleString('fr-FR')}</span></li>)}</ol></Card>
    </div>
  );
}
