import Link from 'next/link';
import { getDict } from '@/i18n';
import { AuthFormClient } from './AuthFormClient';

export async function AuthForm({ mode, next, notice }: { mode: 'login' | 'register' | 'forgot' | 'reset'; next?: string; notice?: string }) {
  const { t } = await getDict();
  const titles = { login: t.nav.login, register: t.nav.register, forgot: t.auth.forgot, reset: t.auth.newPassword };
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl font-extrabold">{titles[mode]}</h1>
      {notice === 'reset' && <p className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-800">{t.auth.resetDone}</p>}
      {notice === 'link' && <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{t.auth.invalid}</p>}
      <AuthFormClient mode={mode} next={next} t={t.auth} submit={mode === 'login' ? t.auth.login : mode === 'register' ? t.auth.register : mode === 'forgot' ? t.auth.send : t.auth.update} />
      <div className="mt-6 space-y-2 text-center text-sm text-neutral-600">
        {mode === 'login' && <><p><Link href="/forgot-password" className="font-medium text-brand">{t.auth.forgot}</Link></p><p>{t.auth.noAccount} <Link href="/register" className="font-semibold text-brand">{t.nav.register}</Link></p></>}
        {mode === 'register' && <p>{t.auth.haveAccount} <Link href="/login" className="font-semibold text-brand">{t.nav.login}</Link></p>}
        {mode === 'forgot' && <p><Link href="/login" className="font-semibold text-brand">{t.nav.login}</Link></p>}
      </div>
    </div>
  );
}
