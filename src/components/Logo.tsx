import Image from 'next/image';
import Link from 'next/link';
/** Logo officiel — fichier original non modifié (public/brand/odthan-logo.png), proportions 1448×1086 conservées. */
export function LogoMark({ className = 'h-10 w-auto' }: { className?: string }) {
  return <Image src="/brand/odthan-logo.png" alt="ODTHAN" width={1448} height={1086} priority className={className} />;
}
export function Logo({ href = '/', dark = false, sub }: { href?: string; dark?: boolean; sub?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5" aria-label="ODTHAN">
      <span className={`flex h-10 w-11 items-center justify-center rounded-lg ${dark ? 'bg-white p-1' : ''}`}><LogoMark className="h-9 w-auto" /></span>
      <span className="leading-tight">
        <span className={`block text-base font-extrabold tracking-tight ${dark ? 'text-white' : 'text-ink'}`}>ODTHAN</span>
        {sub && <span className={`block text-[11px] ${dark ? 'text-neutral-400' : 'text-neutral-500'}`}>{sub}</span>}
      </span>
    </Link>
  );
}
