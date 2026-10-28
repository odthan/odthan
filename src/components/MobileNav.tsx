'use client';
import { useState, type ReactNode } from 'react';
import Link from 'next/link';
import { Icon } from './Icon';

type Auth = { login: string; register: string } | { account: string; logout: string; admin: string | null };
export function MobileNav({ label, links, langForm, auth, logoutAction }: {
  label: string; links: { href: string; label: string }[]; langForm: ReactNode; auth: Auth; logoutAction: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <div className="lg:hidden">
      <button onClick={() => setOpen(!open)} aria-expanded={open} aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-xl border border-neutral-300">
        <Icon name={open ? 'x' : 'menu'} />
      </button>
      {open && (
        <div className="absolute inset-x-0 top-16 animate-slide border-b border-neutral-200 bg-white px-4 pb-5 pt-2 shadow-lg">
          <nav className="flex flex-col" aria-label="Mobile">
            {links.map((l) => <Link key={l.href} href={l.href} onClick={close} className="border-b border-neutral-100 py-3.5 text-base font-medium">{l.label}</Link>)}
          </nav>
          <div className="mt-4 flex flex-col gap-2">
            {'login' in auth ? (
              <>
                <Link href="/register" onClick={close} className="flex min-h-12 items-center justify-center rounded-xl bg-brand font-semibold text-white">{auth.register}</Link>
                <Link href="/login" onClick={close} className="flex min-h-12 items-center justify-center rounded-xl border border-neutral-300 font-semibold">{auth.login}</Link>
              </>
            ) : (
              <>
                {auth.admin && <Link href="/admin" onClick={close} className="flex min-h-12 items-center justify-center rounded-xl bg-ink font-semibold text-white">{auth.admin}</Link>}
                <Link href="/account" onClick={close} className="flex min-h-12 items-center justify-center rounded-xl border border-neutral-300 font-semibold">{auth.account}</Link>
                <form action={logoutAction}><button className="min-h-12 w-full rounded-xl text-neutral-600">{auth.logout}</button></form>
              </>
            )}
            <div className="mt-2 flex justify-center">{langForm}</div>
          </div>
        </div>
      )}
    </div>
  );
}
