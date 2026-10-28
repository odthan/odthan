import { z } from 'zod';

const trimmed = (min: number, max: number) => z.string().trim().min(min).max(max);
const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal('')).transform((v) => (v ? v : null));

export const slugify = (s: string) =>
  s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

export const slugSchema = z.string().trim().min(2).max(80).regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Lettres minuscules, chiffres et tirets uniquement');
export const httpUrl = z.string().trim().max(500).url().refine((u) => /^https?:\/\//i.test(u), 'URL http(s) requise');

export const registerSchema = z.object({
  full_name: trimmed(2, 120), email: z.string().trim().toLowerCase().email().max(200),
  password: z.string().min(8, 'Au moins 8 caractères').max(72), country: optionalText(80),
});
export const forgotSchemaOnly = z.object({ email: z.string().trim().toLowerCase().email() });
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });

export const profileSchema = z.object({
  full_name: trimmed(2, 120), phone: optionalText(40), country: optionalText(80), city: optionalText(80),
  preferred_language: z.enum(['fr', 'ht']),
});

export const requestSchema = z.object({
  service_id: z.string().uuid(),
  project_name: trimmed(2, 150), description: trimmed(10, 5000), country: trimmed(2, 80), city: optionalText(80),
  budget_amount: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().min(0).max(1e10).nullable()),
  budget_currency: z.preprocess((v) => (v ? String(v).toUpperCase() : null), z.string().regex(/^[A-Z]{3}$/).nullable()),
  desired_date: z.preprocess((v) => (v ? String(v) : null), z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable()),
  contact_name: trimmed(2, 120), contact_phone: optionalText(40), contact_email: z.string().trim().email().max(200),
});

export const contactSchema = z.object({
  name: trimmed(2, 120), email: z.string().trim().email().max(200), phone: optionalText(40),
  subject: optionalText(150), message: trimmed(5, 4000),
});

export const categorySchema = z.object({
  name: trimmed(2, 100), slug: slugSchema, description: optionalText(500), icon: optionalText(40),
  sort_order: z.coerce.number().int().min(0).max(100000).default(0),
});

export const serviceSchema = z.object({
  name: trimmed(2, 120), slug: slugSchema, category_id: z.preprocess((v) => (v ? v : null), z.string().uuid().nullable()),
  short_description: trimmed(5, 300), description: optionalText(8000),
  official_url: z.preprocess((v) => (v ? v : null), httpUrl.nullable()),
  countries: z.array(z.string().trim().min(1).max(80)).max(30), languages: z.array(z.string().trim().min(1).max(40)).max(10),
  pricing_type: z.enum(['fixed', 'indicative', 'quote']),
  price: z.preprocess((v) => (v === '' || v == null ? null : Number(v)), z.number().min(0).max(1e10).nullable()),
  currency: z.preprocess((v) => (v ? String(v).toUpperCase() : null), z.string().regex(/^[A-Z]{3}$/).nullable()),
  contact_phone: optionalText(40), contact_button_label: optionalText(60),
  contact_button_url: z.preprocess((v) => (v ? v : null), z.string().trim().max(500).regex(/^(https?:\/\/|mailto:|tel:)\S+$/i).nullable()),
  allow_requests: z.boolean(), is_featured: z.boolean(), sort_order: z.coerce.number().int().min(0).max(100000).default(0),
}).refine((v) => v.pricing_type === 'quote' || (v.price !== null && v.currency !== null), { message: 'Prix et devise requis', path: ['price'] });

export const splitList = (s: FormDataEntryValue | null) =>
  String(s ?? '').split(/[,\n]/).map((x) => x.trim()).filter(Boolean);

export function firstError(e: z.ZodError) {
  const i = e.issues[0];
  return `${i.path.join('.') || 'formulaire'} : ${i.message}`;
}
