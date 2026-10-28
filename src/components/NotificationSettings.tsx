'use client';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { isAudioUnlocked, onAudioState, playAlert, unlockAudio } from '@/lib/sound';

const EVENTS: Record<string, string> = {
  new_request: 'Nouvelle demande', new_message: 'Nouveau message client', new_registration: 'Nouvelle inscription', contact_message: 'Message de contact',
  request_updated: 'Demande modifiée', request_received: 'Demande reçue (client)', status_changed: 'Statut modifié (client)', reply: 'Réponse reçue (client)',
};
const b64 = (s: string) => { const p = '='.repeat((4 - (s.length % 4)) % 4); const r = atob((s + p).replace(/-/g, '+').replace(/_/g, '/')); return Uint8Array.from(r, (c) => c.charCodeAt(0)); };

export function NotificationSettings({ userId, events }: { userId: string; events: string[] }) {
  const [sound, setSound] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [selected, setSelected] = useState<string[]>(events);
  const [pushOn, setPushOn] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const vapid = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

  useEffect(() => {
    setUnlocked(isAudioUnlocked()); const off = onAudioState(() => setUnlocked(isAudioUnlocked()));
    createClient().from('notification_preferences').select('*').eq('user_id', userId).maybeSingle().then(({ data }: { data: any }) => {
      if (data) { setSound(data.sound_enabled); setVolume(Number(data.volume)); setSelected(data.sound_events); setPushOn(data.push_enabled); }
      setLoaded(true);
    });
    return off;
  }, [userId]);

  async function save(patch: Record<string, unknown>) {
    const { error } = await createClient().from('notification_preferences').upsert({ user_id: userId, sound_enabled: sound, volume, sound_events: selected, push_enabled: pushOn, updated_at: new Date().toISOString(), ...patch });
    setMsg(error ? 'Enregistrement impossible (connexion ?).' : 'Préférences enregistrées.');
  }
  async function enableSound() { const ok = await unlockAudio(); setMsg(ok ? 'Alertes sonores activées sur cet appareil.' : 'Le navigateur bloque le son. Touchez à nouveau ou vérifiez le mode silencieux.'); if (ok) playAlert(volume); }
  async function enablePush() {
    setMsg(null);
    if (!vapid) return setMsg('Push non configuré côté serveur (clé VAPID absente).');
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return setMsg('Ce navigateur ne prend pas en charge le Push. Sur iPhone/iPad : ajoutez d’abord l’app à l’écran d’accueil.');
    if ((await Notification.requestPermission()) !== 'granted') return setMsg('Permission refusée. Autorisez les notifications dans les réglages du navigateur.');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(vapid) }));
      const r = await fetch('/api/push/subscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(sub.toJSON()) });
      if (!r.ok) throw new Error();
      setPushOn(true); await save({ push_enabled: true }); setMsg('Notifications Push activées sur cet appareil.');
    } catch { setMsg('Activation du Push impossible (service worker actif seulement en production HTTPS).'); }
  }
  async function disablePush() {
    try {
      const reg = await navigator.serviceWorker.ready; const sub = await reg.pushManager.getSubscription();
      if (sub) { await fetch('/api/push/unsubscribe', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ endpoint: sub.endpoint }) }); await sub.unsubscribe(); }
      setPushOn(false); await save({ push_enabled: false }); setMsg('Push désactivé sur cet appareil.');
    } catch { setMsg('Désactivation impossible.'); }
  }
  const toggle = (k: string) => { const n = selected.includes(k) ? selected.filter((x) => x !== k) : [...selected, k]; setSelected(n); void save({ sound_events: n }); };

  if (!loaded) return <p className="text-sm text-neutral-500">Chargement…</p>;
  return (
    <section className="space-y-5 rounded-2xl border border-neutral-200 bg-white p-5">
      <h2 className="text-lg font-bold">Alertes sonores et Push</h2>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex min-h-11 items-center gap-2 text-sm font-medium"><input type="checkbox" className="h-5 w-5 accent-brand" checked={sound} onChange={(e) => { setSound(e.target.checked); void save({ sound_enabled: e.target.checked }); }} /> Son activé</label>
        <button onClick={enableSound} className={`min-h-11 rounded-xl px-4 text-sm font-semibold ${unlocked ? 'bg-green-100 text-green-800' : 'bg-brand text-white'}`}>{unlocked ? 'Son actif sur cet appareil ✓' : 'Activer les alertes sonores'}</button>
        <button onClick={() => (unlocked ? playAlert(volume) || setMsg('Son bloqué par le navigateur.') : enableSound())} className="min-h-11 rounded-xl border border-neutral-300 px-4 text-sm font-semibold">Tester le son</button>
      </div>
      <label className="block text-sm font-medium">Volume ({Math.round(volume * 100)} %)
        <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(e) => setVolume(Number(e.target.value))} onMouseUp={() => save({ volume })} onTouchEnd={() => save({ volume })} onKeyUp={() => save({ volume })} className="mt-2 w-full accent-brand" />
      </label>
      <fieldset><legend className="text-sm font-medium">Événements qui déclenchent un son</legend>
        <div className="mt-2 grid gap-1 sm:grid-cols-2">{Object.entries(EVENTS).map(([k, l]) => (
          <label key={k} className="flex min-h-10 items-center gap-2 text-sm"><input type="checkbox" className="h-5 w-5 accent-brand" checked={selected.includes(k)} onChange={() => toggle(k)} /> {l}</label>))}</div>
      </fieldset>
      <div className="border-t pt-4">
        <p className="text-sm text-neutral-600">Le son JavaScript ne fonctionne que lorsque l’application est ouverte. Pour être alerté application fermée, activez le Push (permission explicite requise).</p>
        <div className="mt-3">{pushOn ? <button onClick={disablePush} className="min-h-11 rounded-xl border border-neutral-300 px-4 text-sm font-semibold">Désactiver le Push</button>
          : <button onClick={enablePush} className="min-h-11 rounded-xl bg-ink px-4 text-sm font-semibold text-white">Activer les notifications Push</button>}</div>
      </div>
      {msg && <p role="status" className="text-sm text-neutral-700">{msg}</p>}
    </section>
  );
}
