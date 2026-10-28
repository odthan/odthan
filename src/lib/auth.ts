import { cache } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/env';
import type { Permission } from '@/lib/permissions';

export type Access = { user: { id: string; email?: string } | null; roles: string[]; permissions: string[] };

/** Utilisateur validé côté serveur + rôles/permissions lus en base (jamais depuis le navigateur). */
export const getAccess = cache(async (): Promise<Access> => {
  if (!isConfigured()) return { user: null, roles: [], permissions: [] };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, roles: [], permissions: [] };
  const { data } = await supabase.rpc('my_access');
  const a = (data ?? {}) as { roles?: string[]; permissions?: string[] };
  return { user: { id: user.id, email: user.email }, roles: a.roles ?? [], permissions: a.permissions ?? [] };
});

export const isStaffRole = (roles: string[]) => roles.some((r) => r !== 'CLIENT');

export async function requireUser(next = '/account') {
  const a = await getAccess();
  if (!a.user) redirect(`/login?next=${encodeURIComponent(next)}`);
  return a as Access & { user: NonNullable<Access['user']> };
}

export async function requireStaff() {
  const a = await requireUser('/admin');
  if (!isStaffRole(a.roles)) redirect('/account');
  return a;
}

/** Retourne l'accès si la permission est présente, sinon null (la page affiche « accès refusé »). */
export async function checkPerm(p: Permission) {
  const a = await requireStaff();
  return a.permissions.includes(p) ? a : null;
}

export async function logActivity(action: string, entity?: string, entityId?: string, details: Record<string, unknown> = {}) {
  const a = await getAccess();
  if (!a.user) return;
  const supabase = await createClient();
  await supabase.from('admin_activity_logs').insert({ actor_id: a.user.id, action, entity, entity_id: entityId, details });
}
