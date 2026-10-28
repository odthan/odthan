import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/env';

export type Category = { id: string; slug: string; name: string; description: string | null; icon: string | null; image_path: string | null; sort_order: number; is_active: boolean };
export type Service = {
  id: string; slug: string; category_id: string | null; name: string; short_description: string; description: string | null;
  logo_path: string | null; cover_path: string | null; official_url: string | null; countries: string[]; languages: string[];
  pricing_type: 'fixed' | 'indicative' | 'quote'; price: number | null; currency: string | null; contact_phone: string | null;
  contact_button_label: string | null; contact_button_url: string | null; allow_requests: boolean; sort_order: number;
  status: 'draft' | 'published' | 'unpublished'; is_active: boolean; is_featured: boolean; created_at: string; updated_at: string;
  service_categories?: { name: string; slug: string } | null;
};

export function publicUrl(bucket: string, path: string | null) {
  if (!path) return null;
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`;
}

/** Retire les caractères spéciaux du filtre PostgREST pour éviter toute injection de filtre. */
export const cleanQuery = (q: string) => q.replace(/[,()%*\\"'.:]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

export const getSiteSettings = cache(async (): Promise<Record<string, any>> => {
  if (!isConfigured()) return {};
  const supabase = await createClient();
  const { data } = await supabase.from('site_settings').select('key,value');
  return Object.fromEntries((data ?? []).map((r: any) => [r.key, r.value]));
});

export async function getPublicCategories(): Promise<Category[]> {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from('service_categories').select('*').eq('is_active', true).order('sort_order').order('name');
  return (data ?? []) as Category[];
}

export async function searchPublicServices(opts: { q?: string; category?: string }): Promise<Service[]> {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  let query = supabase.from('services').select('*, service_categories(name,slug)')
    .eq('status', 'published').eq('is_active', true).order('sort_order').order('name');
  if (opts.category) {
    const { data: cat } = await supabase.from('service_categories').select('id').eq('slug', opts.category).maybeSingle();
    if (!cat) return [];
    query = query.eq('category_id', cat.id);
  }
  const q = cleanQuery(opts.q ?? '');
  if (q) {
    const { data: cats } = await supabase.from('service_categories').select('id').ilike('name', `%${q}%`);
    const ids = (cats ?? []).map((c: any) => c.id);
    const parts = [`name.ilike.%${q}%`, `short_description.ilike.%${q}%`, `description.ilike.%${q}%`];
    if (ids.length) parts.push(`category_id.in.(${ids.join(',')})`);
    query = query.or(parts.join(','));
  }
  const { data } = await query;
  return (data ?? []) as unknown as Service[];
}

export async function getPublicService(slug: string): Promise<Service | null> {
  if (!isConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from('services').select('*, service_categories(name,slug)')
    .eq('slug', slug).eq('status', 'published').eq('is_active', true).maybeSingle();
  return (data as unknown as Service) ?? null;
}

export function formatPrice(s: Pick<Service, 'pricing_type' | 'price' | 'currency'>, t: { quote: string; from: string; fixed: string }) {
  if (s.pricing_type === 'quote' || s.price == null) return t.quote;
  const amount = `${new Intl.NumberFormat('fr-FR').format(Number(s.price))} ${s.currency ?? ''}`.trim();
  return s.pricing_type === 'indicative' ? `${t.from} ${amount}` : `${t.fixed} : ${amount}`;
}
