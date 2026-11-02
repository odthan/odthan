import { cache } from 'react';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isConfigured } from '@/lib/env';
import { httpUrl } from '@/lib/validation';

export type SocialLink = { id: string; platform: string; name: string; url: string; icon_path: string | null; sort_order: number; is_active: boolean };

/** ODTHAN SOSYAL : plateformes actives, dans l'ordre d'affichage. */
export const getSocialLinks = cache(async (): Promise<SocialLink[]> => {
  if (!isConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase.from('social_links').select('id,platform,name,url,icon_path,sort_order,is_active').eq('is_active', true).order('sort_order');
  return (data ?? []) as SocialLink[];
});

export const socialIconUrl = (path: string | null) => (path ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/social-media/${path}` : null);

export const socialSchema = z.object({
  name: z.string().trim().min(1).max(40),
  platform: z.enum(['x', 'facebook', 'instagram', 'tiktok', 'clapper', 'pinterest', 'youtube', 'whatsapp', 'link']),
  url: httpUrl,
});
