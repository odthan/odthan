import { cookies } from 'next/headers';
import { fr, type Dict } from './fr';
import { getSiteSettings } from '@/lib/data';
import { isConfigured } from '@/lib/env';
import { ht } from './ht';
export type Lang = 'fr' | 'ht';
export async function getLang(): Promise<Lang> {
  const v = (await cookies()).get('lang')?.value;
  if (v === 'ht' || v === 'fr') return v;
  if (!isConfigured()) return 'fr';
  const def = (await getSiteSettings()).locale?.default_language;
  return def === 'ht' ? 'ht' : 'fr';
}
export async function getDict(): Promise<{ t: Dict; lang: Lang }> {
  const lang = await getLang();
  return { t: lang === 'ht' ? ht : fr, lang };
}
export const statusLabel = (t: Dict, s: string) => (t.statuses as Record<string, string>)[s] ?? s;
