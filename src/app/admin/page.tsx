import { checkPerm } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Card, Flash, Forbidden, PageHead } from '@/components/admin-ui';
import { ConfirmButton } from '@/components/ConfirmButton';
import { grantRole, revokeRole, setRoleActive } from '../actions';
import { ROLE_MATRIX } from '@/lib/permissions';

export const metadata = { title: 'Utilisateurs & rôles' };
export default async function UsersAdmin({ searchParams }: { searchParams: Promise<{ m?: string; e?: string }> }) {
  const a = await checkPerm('users.manage'); if (!a) return <Forbidden />;
  const sp = await searchParams; const supabase = await createClient();
  const { data: roles } = await supabase.from('user_roles').select('user_id,role,is_active,created_at').neq('role', 'CLIENT').order('created_at');
  const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
  const { data: profs } = ids.length ? await supabase.from('profiles').select('id,full_name,email').in('id', ids) : { data: [] as any[] };
  const logs = a.permissions.includes('logs.view') ? (await supabase.from('admin_activity_logs').select('id,actor_id,action,entity,created_at,details').order('created_at', { ascending: false }).limit(40)).data ?? [] : null;
  const name = (id: string | null) => { const p = (profs ?? []).find((x: any) => x.id === id); return p ? p.full_name || p.email : id ? id.slice(0, 8) : '—'; };
  const isSuper = a.roles.includes('SUPER_ADMIN');
  const assignable = isSuper ? ['ADMIN', 'MANAGER', 'EDITOR', 'SUPPORT', 'SUPER_ADMIN'] : ['MANAGER', 'EDITOR', 'SUPPORT'];
  return (
    <>
      <PageHead title="Utilisateurs & rôles" sub="Les rôles sont stockés en base et vérifiés par le serveur et par RLS : jamais dans le navigateur." />
      <Flash m={sp.m} e={sp.e} />
      <Card className="mb-5"><h2 className="mb-3 font-bold">Attribuer un accès</h2>
        <form action={grantRole} className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"><input name="email" type="email" required placeholder="E-mail du compte existant" className="min-h-11 rounded-xl border border-neutral-300 px-3 text-base sm:text-sm" />
          <select name="role" className="min-h-11 rounded-xl border border-neutral-300 px-3 text-base sm:text-sm">{assignable.map((r) => <option key={r}>{r}</option>)}</select><button className="min-h-11 rounded-xl bg-brand px-5 text-sm font-semibold text-white">Attribuer</button></form>
        <p className="mt-2 text-xs text-neutral-500">La personne doit d’abord créer son compte. Seul un SUPER_ADMIN peut attribuer ADMIN ou SUPER_ADMIN.</p></Card>
      <ul className="space-y-3">{(roles ?? []).map((r) => (
        <li key={r.user_id + r.role}><Card><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-bold">{name(r.user_id)}</p><p className="text-xs text-neutral-500">{(profs ?? []).find((x: any) => x.id === r.user_id)?.email}</p></div>
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${r.is_active ? 'bg-ink text-white' : 'bg-neutral-200 text-neutral-600'}`}>{r.role}{r.is_active ? '' : ' (suspendu)'}</span></div>
          {r.user_id !== a.user.id && <div className="mt-3 flex gap-2 text-sm">
            <form action={setRoleActive}><input type="hidden" name="user_id" value={r.user_id} /><input type="hidden" name="role" value={r.role} /><input type="hidden" name="active" value={r.is_active ? '0' : '1'} /><button className="min-h-10 rounded-lg border px-3 font-semibold">{r.is_active ? 'Suspendre' : 'Réactiver'}</button></form>
            <form action={revokeRole}><input type="hidden" name="user_id" value={r.user_id} /><input type="hidden" name="role" value={r.role} /><ConfirmButton message="Révoquer définitivement cet accès ?" className="min-h-10 rounded-lg border border-red-300 px-3 font-semibold text-red-700">Révoquer</ConfirmButton></form></div>}</Card></li>))}</ul>
      <Card className="mt-6"><h2 className="mb-2 font-bold">Permissions par rôle</h2><dl className="space-y-2 text-sm">{Object.entries(ROLE_MATRIX).filter(([r]) => r !== 'CLIENT').map(([r, p]) => <div key={r}><dt className="font-semibold">{r}</dt><dd className="text-neutral-600">{p.join(', ')}</dd></div>)}</dl><p className="mt-2 text-xs text-neutral-500">CLIENT : accès à ses propres données uniquement.</p></Card>
      {logs && <Card className="mt-6"><h2 className="mb-3 font-bold">Journal d’activité administrative</h2>{logs.length === 0 ? <p className="text-sm text-neutral-500">Aucune activité.</p> : <ul className="divide-y text-sm">{logs.map((l) => <li key={l.id} className="py-2"><span className="font-semibold">{l.action}</span> <span className="text-neutral-500">{l.entity ?? ''} — {name(l.actor_id)}</span><span className="block text-xs text-neutral-400">{new Date(l.created_at).toLocaleString('fr-FR')}</span></li>)}</ul>}</Card>}
    </>
  );
}
