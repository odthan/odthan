export function rangeFor(r: string | undefined, from?: string, to?: string): { from: Date; to: Date; label: string } {
  const now = new Date(); const startDay = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const tomorrow = new Date(startDay.getTime() + 86400000);
  if (r === 'today') return { from: startDay, to: tomorrow, label: 'Aujourd’hui' };
  if (r === '30d') return { from: new Date(startDay.getTime() - 29 * 86400000), to: tomorrow, label: '30 derniers jours' };
  if (r === 'year') return { from: new Date(Date.UTC(now.getUTCFullYear(), 0, 1)), to: tomorrow, label: 'Cette année' };
  if (r === 'custom' && from && to && /^\d{4}-\d{2}-\d{2}$/.test(from) && /^\d{4}-\d{2}-\d{2}$/.test(to)) {
    const f = new Date(from + 'T00:00:00Z'), t = new Date(new Date(to + 'T00:00:00Z').getTime() + 86400000);
    if (f < t && t.getTime() - f.getTime() <= 400 * 86400000) return { from: f, to: t, label: `${from} → ${to}` };
  }
  return { from: new Date(startDay.getTime() - 6 * 86400000), to: tomorrow, label: '7 derniers jours' };
}

