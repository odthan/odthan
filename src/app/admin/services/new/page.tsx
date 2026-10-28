import { checkPerm } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Forbidden, PageHead } from '@/components/admin-ui';
import { ServiceForm } from '../ServiceForm';

export default async function NewService() {
  if (!(await checkPerm('services.manage'))) return <Forbidden />;
  const { data } = await (await createClient()).from('service_categories').select('id,name').order('sort_order');
  return (<><PageHead title="Ajouter un service" /><ServiceForm categories={data ?? []} /></>);
}
