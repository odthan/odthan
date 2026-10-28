import { checkPerm } from '@/lib/auth';
import { getSiteSettings } from '@/lib/data';
import { Forbidden, PageHead } from '@/components/admin-ui';
import { SettingsForm } from './SettingsForm';

export const metadata = { title: 'Paramètres' };
export default async function SettingsAdmin() {
  if (!(await checkPerm('settings.manage'))) return <Forbidden />;
  const s = await getSiteSettings();
  return (<><PageHead title="Paramètres" sub="Stockés en base de données. Les secrets techniques (clés Supabase, VAPID) se gèrent dans les variables d’environnement Vercel, pas ici." /><SettingsForm s={s} /></>);
}
