'use client';
/** Alerte sonore générée par WebAudio (aucun fichier audio). Les navigateurs exigent un geste de l'utilisateur avant de jouer un son. */
let ctx: AudioContext | null = null;
let unlocked = false;
const listeners = new Set<() => void>();

function getCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) { const AC = window.AudioContext || (window as any).webkitAudioContext; if (!AC) return null; ctx = new AC(); }
  return ctx;
}
export async function unlockAudio(): Promise<boolean> {
  const c = getCtx(); if (!c) return false;
  try { await c.resume(); } catch { return false; }
  unlocked = c.state === 'running';
  listeners.forEach((l) => l());
  return unlocked;
}
export const isAudioUnlocked = () => unlocked && ctx?.state === 'running';
export function onAudioState(cb: () => void) { listeners.add(cb); return () => { listeners.delete(cb); }; }

/** Installe un déverrouillage automatique au premier toucher/clic/touche. */
export function armAutoUnlock() {
  const h = () => { void unlockAudio(); window.removeEventListener('pointerdown', h); window.removeEventListener('keydown', h); };
  window.addEventListener('pointerdown', h, { once: true }); window.addEventListener('keydown', h, { once: true });
}
/** Joue deux notes brèves. Retourne false si le navigateur bloque le son. */
export function playAlert(volume = 0.7): boolean {
  const c = getCtx(); if (!c || c.state !== 'running') return false;
  const v = Math.max(0, Math.min(1, volume)); const t0 = c.currentTime;
  [[880, 0], [1175, 0.14]].forEach(([f, dt]) => {
    const o = c.createOscillator(), g = c.createGain();
    o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t0 + dt); g.gain.linearRampToValueAtTime(0.35 * v, t0 + dt + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dt + 0.28);
    o.connect(g).connect(c.destination); o.start(t0 + dt); o.stop(t0 + dt + 0.3);
  });
  return true;
}
