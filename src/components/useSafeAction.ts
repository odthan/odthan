'use client';
import { useActionState, useTransition, type FormEvent } from 'react';

/** Comme useActionState, mais sans la réinitialisation automatique du formulaire par React 19 :
 *  en cas d'erreur de validation, l'utilisateur ne perd pas ce qu'il a saisi. */
export function useSafeAction<S>(action: (prev: any, fd: FormData) => Promise<S>) {
  const [rawState, dispatch, pendingAction] = useActionState(action as (p: any, fd: FormData) => Promise<any>, null);
  const [pendingTransition, start] = useTransition();
  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const submitter = (e.nativeEvent as SubmitEvent).submitter as HTMLElement | null;
    const fd = new FormData(e.currentTarget, submitter);   // inclut le bouton cliqué (name/value)
    start(() => { dispatch(fd); });
  };
  return { state: rawState as S | null, onSubmit, pending: pendingAction || pendingTransition };
}
