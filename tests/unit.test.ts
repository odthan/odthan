import { describe, expect, it } from 'vitest';
import { serviceSchema, requestSchema, registerSchema, slugify, splitList, contactSchema } from '@/lib/validation';
import { ROLE_MATRIX, PERMISSIONS } from '@/lib/permissions';
import { cleanQuery, formatPrice } from '@/lib/data';
import { rangeFor } from '@/lib/analytics-range';
import { fr } from '@/i18n/fr';
import { ht } from '@/i18n/ht';

const base = { name: 'KONSTRIVAL', slug: 'konstrival', category_id: '', short_description: 'Carrelage et construction', description: '', official_url: 'https://konstrival.odthan.com',
  countries: ['Haïti'], languages: [], pricing_type: 'quote', price: '', currency: '', contact_phone: '', contact_button_label: '', contact_button_url: '', allow_requests: true, is_featured: false, sort_order: 0 };

describe('validation des services', () => {
  it('accepte un service valide (devis)', () => expect(serviceSchema.safeParse(base).success).toBe(true));
  it('refuse une URL javascript:', () => expect(serviceSchema.safeParse({ ...base, official_url: 'javascript:alert(1)' }).success).toBe(false));
  it('refuse un slug invalide', () => expect(serviceSchema.safeParse({ ...base, slug: 'Mon Service!' }).success).toBe(false));
  it('exige prix et devise pour un prix fixe', () => expect(serviceSchema.safeParse({ ...base, pricing_type: 'fixed' }).success).toBe(false));
  it('accepte un prix fixe complet', () => expect(serviceSchema.safeParse({ ...base, pricing_type: 'fixed', price: '120', currency: 'usd' }).success).toBe(true));
  it('refuse un bouton de contact non http/mailto/tel', () => expect(serviceSchema.safeParse({ ...base, contact_button_url: 'ftp://x' }).success).toBe(false));
});
describe('autres validations', () => {
  it('slugify retire les accents', () => expect(slugify('Services numériques & Informatique')).toBe('services-numeriques-informatique'));
  it('splitList', () => expect(splitList('Haïti, République dominicaine,\n ')).toEqual(['Haïti', 'République dominicaine']));
  it('mot de passe trop court refusé', () => expect(registerSchema.safeParse({ full_name: 'Jean', email: 'a@b.co', password: '1234' }).success).toBe(false));
  it('e-mail normalisé', () => expect(registerSchema.parse({ full_name: 'Jean', email: ' A@B.CO ', password: '12345678' }).email).toBe('a@b.co'));
  it('demande : champs obligatoires', () => expect(requestSchema.safeParse({ service_id: 'x' }).success).toBe(false));
  it('contact : message trop court refusé', () => expect(contactSchema.safeParse({ name: 'Jo', email: 'a@b.co', message: 'a' }).success).toBe(false));
});
describe('permissions', () => {
  it('SUPER_ADMIN a toutes les permissions', () => expect(ROLE_MATRIX.SUPER_ADMIN.length).toBe(PERMISSIONS.length));
  it('seul SUPER_ADMIN gère les paramètres', () => { for (const r of Object.keys(ROLE_MATRIX) as (keyof typeof ROLE_MATRIX)[]) expect(ROLE_MATRIX[r].includes('settings.manage')).toBe(r === 'SUPER_ADMIN'); });
  it('CLIENT n’a aucune permission staff', () => expect(ROLE_MATRIX.CLIENT).toEqual([]));
  it('SUPPORT ne gère pas les services', () => expect(ROLE_MATRIX.SUPPORT.includes('services.manage')).toBe(false));
});
describe('recherche et prix', () => {
  it('cleanQuery neutralise les caractères de filtre', () => expect(cleanQuery('a),name.eq.x,(b%')).not.toMatch(/[,()%]/));
  it('formatPrice devis', () => expect(formatPrice({ pricing_type: 'quote', price: null, currency: null }, { quote: 'Sur devis', from: 'À partir de', fixed: 'Prix' })).toBe('Sur devis'));
  it('formatPrice indicatif', () => expect(formatPrice({ pricing_type: 'indicative', price: 50, currency: 'USD' }, { quote: 'Sur devis', from: 'À partir de', fixed: 'Prix' })).toContain('À partir de 50 USD'));
});
describe('période analytique', () => {
  it('7 jours par défaut = 7 jours', () => { const r = rangeFor(undefined); expect(Math.round((r.to.getTime() - r.from.getTime()) / 86400000)).toBe(7); });
  it('personnalisée valide', () => { const r = rangeFor('custom', '2026-01-01', '2026-01-10'); expect(Math.round((r.to.getTime() - r.from.getTime()) / 86400000)).toBe(10); });
  it('personnalisée inversée → retombe sur 7 jours', () => expect(rangeFor('custom', '2026-02-01', '2026-01-01').label).toBe('7 derniers jours'));
});
describe('i18n', () => {
  const keys = (o: any, p = ''): string[] => Object.entries(o).flatMap(([k, v]) => (typeof v === 'object' ? keys(v, p + k + '.') : [p + k]));
  it('FR et HT ont exactement les mêmes clés', () => expect(keys(ht).sort()).toEqual(keys(fr).sort()));
  it('aucune valeur HT vide', () => keys(ht).forEach((k) => expect(k.split('.').reduce((a: any, c) => a[c], ht)).toBeTruthy()));
  it('le nom de l’application est ODTHAN (pas InfGlo) dans les textes', () => expect(JSON.stringify(fr) + JSON.stringify(ht)).not.toMatch(/InfGlo/));
});
