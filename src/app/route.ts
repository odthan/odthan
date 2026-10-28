import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';

const schema = z.object({
  type: z.enum(['page_view', 'service_view', 'request_submitted', 'whatsapp_click']),
  path: z.string().max(300).optional(),
  service_id: z.string().uuid().nullish(), category_id: z.string().uuid().nullish(),
  visitor_id: z.string().max(64), session_id: z.string().max(64),
  referrer: z.string().max(500).nullish(),
  utm_source: z.string().max(100).nullish(), utm_medium: z.string().max(100).nullish(), utm_campaign: z.string().max(100).nullish(),
});
const hits = new Map<string, { n: number; t: number }>();

function parseUA(ua: string) {
  const device = /ipad|tablet/i.test(ua) ? 'tablet' : /mobi|android|iphone/i.test(ua) ? 'mobile' : 'desktop';
  const browser = /edg\//i.test(ua) ? 'Edge' : /opr\/|opera/i.test(ua) ? 'Opera' : /samsungbrowser/i.test(ua) ? 'Samsung Internet'
    : /chrome|crios/i.test(ua) ? 'Chrome' : /firefox|fxios/i.test(ua) ? 'Firefox' : /safari/i.test(ua) ? 'Safari' : 'Autre';
  return { device, browser };
}

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();
    if (raw.length > 2000) return new NextResponse(null, { status: 413 });
    const parsed = schema.safeParse(JSON.parse(raw));
    if (!parsed.success) return new NextResponse(null, { status: 400 });
    const ip = (req.headers.get('x-forwarded-for') ?? 'anon').split(',')[0].trim();
    const now = Date.now(); const h = hits.get(ip);
    if (h && now - h.t < 60_000) { if (h.n >= 120) return new NextResponse(null, { status: 429 }); h.n++; } else hits.set(ip, { n: 1, t: now });
    const d = parsed.data;
    let refHost: string | null = null;
    try { if (d.referrer) { const u = new URL(d.referrer); if (u.host !== req.nextUrl.host) refHost = u.host.slice(0, 200); } } catch { /* ignore */ }
    const { device, browser } = parseUA(req.headers.get('user-agent') ?? '');
    const country = (req.headers.get('x-vercel-ip-country') ?? '').slice(0, 2).toUpperCase() || null;
    // Aucune IP, aucun user-agent brut, aucun identifiant de compte n'est enregistré.
    await createAdminClient().from('analytics_events').insert({
      event_type: d.type, path: d.path?.split('?')[0], service_id: d.service_id ?? null, category_id: d.category_id ?? null,
      visitor_id: d.visitor_id, session_id: d.session_id, referrer_host: refHost,
      utm_source: d.utm_source, utm_medium: d.utm_medium, utm_campaign: d.utm_campaign, device, browser, country,
    });
    return new NextResponse(null, { status: 204 });
  } catch { return new NextResponse(null, { status: 204 }); }
}
