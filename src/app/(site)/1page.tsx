import type { Metadata } from 'next';
import { getSocialLinks } from '@/lib/sosyal-data';
import { SosyalSection } from '@/components/SosyalSection';
import { SOSYAL_TEXT, SOSYAL_TITLE } from '@/lib/sosyal';

export const metadata: Metadata = { title: SOSYAL_TITLE, description: SOSYAL_TEXT };
export const dynamic = 'force-dynamic';

/** Page publique ODTHAN SOSYAL : /sosyal */
export default async function SosyalPage() {
  const links = await getSocialLinks();
  if (links.length === 0) return <div className="mx-auto max-w-xl px-4 py-24 text-center text-neutral-600">Pa gen rezo sosyal pou kounye a.</div>;
  return <div className="pb-8"><SosyalSection links={links} /></div>;
}
