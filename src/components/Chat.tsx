'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export type Msg = { id: string; sender_id: string; is_staff: boolean; body: string; created_at: string; read_at: string | null };

export function Chat({ conversationId, userId, asStaff, initial, labels }: {
  conversationId: string; userId: string; asStaff: boolean; initial: Msg[];
  labels: { placeholder: string; send: string; empty: string; title: string };
}) {
  const [msgs, setMsgs] = useState<Msg[]>(initial);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const end = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    void supabase.rpc('mark_messages_read', { p_conversation: conversationId });
    const ch = supabase.channel(`chat-${conversationId}-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${conversationId}` }, (p: { new: unknown }) => {
        const m = p.new as Msg;
        setMsgs((cur) => (cur.some((x) => x.id === m.id) ? cur : [...cur, m]));
        if (m.sender_id !== userId) void supabase.rpc('mark_messages_read', { p_conversation: conversationId });
      }).subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [conversationId, userId]);
  useEffect(() => { end.current?.scrollIntoView({ block: 'end' }); }, [msgs.length]);

  async function send(e: React.FormEvent) {
    e.preventDefault(); const body = text.trim(); if (!body || busy) return;
    setBusy(true); setErr(null);
    const { data, error } = await createClient().from('messages').insert({ conversation_id: conversationId, sender_id: userId, is_staff: asStaff, body })
      .select('id,sender_id,is_staff,body,created_at,read_at').single();
    setBusy(false);
    if (error || !data) return setErr('Message non envoyé : vérifiez votre connexion et réessayez.');   // jamais de faux « envoyé »
    setMsgs((cur) => (cur.some((x) => x.id === data.id) ? cur : [...cur, data as Msg])); setText('');
  }
  const fmt = (d: string) => new Date(d).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  return (
    <section aria-label={labels.title} className="rounded-2xl border border-neutral-200 bg-white">
      <h2 className="border-b px-4 py-3 text-base font-bold">{labels.title}</h2>
      <div className="max-h-[50vh] space-y-3 overflow-y-auto p-4" aria-live="polite">
        {msgs.length === 0 && <p className="text-sm text-neutral-500">{labels.empty}</p>}
        {msgs.map((m) => {
          const mine = m.sender_id === userId;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm ${mine ? 'bg-ink text-white' : m.is_staff ? 'bg-brand-soft text-ink' : 'bg-mist text-ink'}`}>
                <p className="whitespace-pre-wrap break-words">{m.body}</p>
                <p className={`mt-1 text-[11px] ${mine ? 'text-neutral-400' : 'text-neutral-500'}`}>{fmt(m.created_at)}{mine && (m.read_at ? ' · lu' : ' · envoyé')}</p>
              </div>
            </div>);
        })}
        <div ref={end} />
      </div>
      <form onSubmit={send} className="flex gap-2 border-t p-3">
        <textarea value={text} onChange={(e) => setText(e.target.value)} placeholder={labels.placeholder} maxLength={4000} rows={2} aria-label={labels.placeholder}
          className="block w-full resize-none rounded-xl border border-neutral-300 px-3 py-2 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/25 sm:text-sm" />
        <button disabled={busy || !text.trim()} className="min-h-11 self-end rounded-xl bg-brand px-4 text-sm font-semibold text-white disabled:opacity-50">{busy ? '…' : labels.send}</button>
      </form>
      {err && <p role="alert" className="px-4 pb-3 text-sm text-red-700">{err}</p>}
    </section>
  );
}
