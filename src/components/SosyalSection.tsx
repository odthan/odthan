import { socialIconUrl, type SocialLink } from '@/lib/sosyal-data';
import { SocialButton, SocialGlyph } from './SocialButton';
import { SOSYAL_NAME, SOSYAL_TEXT, SOSYAL_TITLE } from '@/lib/sosyal';

/** ODTHAN SOSYAL — section publique. */
export function SosyalSection({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null;
  return (
    <section id="sosyal" aria-labelledby="sosyal-title" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-16">
      <div className="overflow-hidden rounded-3xl bg-ink px-5 py-10 text-white shadow-xl sm:px-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.3em] text-brand">{SOSYAL_NAME}</p>
          <h2 id="sosyal-title" className="mt-2 text-3xl font-extrabold sm:text-4xl">{SOSYAL_TITLE}</h2>
          <div className="mx-auto mt-3 h-1 w-16 rounded-full bg-brand" />
          <p className="mt-4 text-sm text-neutral-300 sm:text-base">{SOSYAL_TEXT}</p>
        </div>
        <ul className="mx-auto mt-8 grid max-w-3xl grid-cols-3 gap-3 sm:grid-cols-5">
          {links.map((l) => (
            <li key={l.id}>
              <SocialButton id={l.id} url={l.url} name={l.name}
                className="group flex h-full min-h-[92px] flex-col items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-3 text-center transition hover:-translate-y-0.5 hover:border-brand hover:bg-brand/20 focus-visible:outline-white">
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-ink transition group-hover:bg-brand group-hover:text-white">
                  <SocialGlyph platform={l.platform} iconUrl={socialIconUrl(l.icon_path)} className="h-6 w-6" />
                </span>
                <span className="text-xs font-semibold leading-tight sm:text-sm">{l.name}</span>
              </SocialButton>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/** Rangée compacte d'icônes (pied de page). */
export function SosyalIcons({ links }: { links: SocialLink[] }) {
  if (links.length === 0) return null;
  return (
    <ul className="flex flex-wrap gap-2" aria-label={SOSYAL_TITLE}>
      {links.map((l) => (
        <li key={l.id}>
          <SocialButton id={l.id} url={l.url} name={l.name}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-brand focus-visible:outline-white">
            <SocialGlyph platform={l.platform} iconUrl={socialIconUrl(l.icon_path)} className="h-5 w-5" />
          </SocialButton>
        </li>
      ))}
    </ul>
  );
}
