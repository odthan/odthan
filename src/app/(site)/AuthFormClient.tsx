'use client';
import { useSafeAction } from '@/components/useSafeAction';
import { Field, Input } from '@/components/fields';
import { FormMsg, SubmitButton } from '@/components/ui';
import { forgotPassword, login, register, resetPassword } from './auth-actions';
import type { Dict } from '@/i18n/fr';

export function AuthFormClient({ mode, next, t, submit }: { mode: 'login' | 'register' | 'forgot' | 'reset'; next?: string; t: Dict['auth']; submit: string }) {
  const act = { login, register, forgot: forgotPassword, reset: resetPassword }[mode];
  const { state, onSubmit, pending } = useSafeAction(act);
  const done = mode !== 'login' && Boolean(state?.ok);
  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      {next && <input type="hidden" name="next" value={next} />}
      {mode === 'register' && <Field label={t.fullName}><Input name="full_name" required minLength={2} maxLength={120} autoComplete="name" /></Field>}
      {mode !== 'reset' && !done && <Field label={t.email}><Input type="email" name="email" required maxLength={200} autoComplete="email" inputMode="email" /></Field>}
      {mode === 'register' && <Field label={t.country}><Input name="country" maxLength={80} autoComplete="country-name" /></Field>}
      {(mode === 'login' || mode === 'register' || mode === 'reset') && (
        <Field label={mode === 'reset' ? t.newPassword : t.password} hint={mode !== 'login' ? t.passwordHint : undefined}>
          <Input type="password" name="password" required minLength={mode === 'login' ? 1 : 8} maxLength={72} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
        </Field>
      )}
      <FormMsg state={state} />
      {!done && <SubmitButton busy={pending} className="w-full">{submit}</SubmitButton>}
    </form>
  );
}
