import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const schema = z.object({ social_link_id: z.string().uuid(), path: z.string().max(300).optional(), visitor_id: z.string().max(64), session_id: z.string().max(64) });
const hits = new Map<string, { n: number; t: number }>();

/** Enregistre un clic ODTHAN SOSYAL (sans IP ni donnée personnelle). Appelé seulement après consentement. */
export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > 1000) return new NextResponse(null, { status: 413 });
    const p = schema.safeParse(JSON.parse(raw));
    if (!p.success) return new NextResponse(null, { status: 400 });
    const ip = (req.headers.get('x-forwarded-for') ?? 'anon').split(',')[0].trim(); const now = Date.now(); const h = hits.get(ip);
    if (h && now - h.t < 60_000) { if (h.n >= 60) return new NextResponse(null, { status: 429 }); h.n++; } else hits.set(ip, { n: 1, t: now });
    const ua = req.headers.get('user-agent') ?? '';
    const device = /ipad|tablet/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop';
    await createAdminClient().from('analytics_events').insert({
      event_type: 'social_click', path: p.data.path?.split('?')[0], social_link_id: p.data.social_link_id,
      visitor_id: p.data.visitor_id, session_id: p.data.session_id, device,
      country: (req.headers.get('x-vercel-ip-country') ?? '').slice(0, 2).toUpperCase() || null,
    });
    return new NextResponse(null, { status: 204 });
  } catch { return new NextResponse(null, { status: 204 }); }
}
