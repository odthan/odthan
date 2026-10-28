import { notFound } from 'next/navigation';
import { checkPerm } from '@/lib/auth';
import { createClient } from '@/lib/supabase/server';
import { Forbidden, PageHead } from '@/components/admin-ui';
import { ServiceForm } from '../ServiceForm';

export default async function EditService({ params }: { params: Promise<{ id: string }> }) {
  if (!(await checkPerm('services.manage'))) return <Forbidden />;
  const { id } = await params; if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const [{ data: s }, { data: cats }] = await Promise.all([supabase.from('services').select('*').eq('id', id).maybeSingle(), supabase.from('service_categories').select('id,name').order('sort_order')]);
  if (!s) notFound();
  return (<><PageHead title={`Modifier : ${s.name}`} /><ServiceForm s={s} categories={cats ?? []} /></>);
}
