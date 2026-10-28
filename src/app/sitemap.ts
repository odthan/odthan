import type { MetadataRoute } from 'next';
import { SITE_URL, isConfigured } from '@/lib/env';
import { createClient } from '@/lib/supabase/server';
export const dynamic = 'force-dynamic';
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [{ url: SITE_URL, changeFrequency: 'daily', priority: 1 }, { url: `${SITE_URL}/contact` }, { url: `${SITE_URL}/privacy` }];
  if (!isConfigured()) return base;
  const supabase = await createClient();
  const { data } = await supabase.from('services').select('slug,updated_at').eq('status', 'published').eq('is_active', true);
  return [...base, ...(data ?? []).map((s: any) => ({ url: `${SITE_URL}/services/${s.slug}`, lastModified: s.updated_at, priority: 0.8 }))];
}
