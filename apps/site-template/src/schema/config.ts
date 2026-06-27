import { z } from 'zod';

// ─── Primitives ───────────────────────────────────────────────────────────────

const HexColor = z
  .string()
  .regex(/^#[0-9a-fA-F]{6}$/, 'Doit être une couleur hex valide (ex: #1a2b3c)');

const KebabSlug = z
  .string()
  .regex(/^[a-z0-9-]+$/, 'Le slug doit être en kebab-case minuscule');

// ─── Local Data ───────────────────────────────────────────────────────────────

const FaqSchema = z.object({
  q: z.string().min(1),
  a: z.string().min(1),
});

const LocalDataSchema = z.object({
  neighborhoods:      z.array(z.string()).optional(),
  price_context:      z.string().optional(),
  faqs:               z.array(FaqSchema).optional(),
  competitor_context: z.string().optional(),
  local_landmarks:    z.array(z.string()).optional(),
});

function countLocalDataFields(d: z.infer<typeof LocalDataSchema>): number {
  let n = 0;
  if (d.neighborhoods      && d.neighborhoods.length > 0)      n++;
  if (d.price_context      && d.price_context.trim().length > 0) n++;
  if (d.faqs               && d.faqs.length > 0)               n++;
  if (d.competitor_context && d.competitor_context.trim().length > 0) n++;
  if (d.local_landmarks    && d.local_landmarks.length > 0)    n++;
  return n;
}

// Variante avec la règle des ≥2 champs — obligatoire sur chaque page de service
const RequiredLocalDataSchema = LocalDataSchema.refine(
  (d) => countLocalDataFields(d) >= 2,
  {
    message:
      'local_data doit avoir au moins 2 champs remplis parmi : neighborhoods, price_context, faqs, competitor_context, local_landmarks. Minimum requis pour garantir un contenu local unique (anti-duplicate-content Google).',
  }
);

// ─── Section de contenu générique ─────────────────────────────────────────────

const ContentSectionSchema = z.object({
  heading: z.string().min(1),
  body:    z.string().min(1),
});

// ─── Sections de la page d'accueil ────────────────────────────────────────────

const HomeSectionSchema = z.object({
  type:     z.enum(['content', 'services_grid', 'service_areas', 'faq', 'cta']),
  heading:  z.string().optional(),
  body:     z.string().optional(),
  subtitle: z.string().optional(),
});

// ─── Page de service ──────────────────────────────────────────────────────────

const ServicePageSchema = z.object({
  slug:             KebabSlug,
  nav_label:        z.string().max(30, 'nav_label doit être court (max 30 car.) — il apparaît dans le menu'),
  h1:               z.string().min(1),
  meta_title:       z.string().min(1).max(60, 'meta_title trop long (max 60 car. pour Google)'),
  meta_description: z.string().min(1).max(160, 'meta_description trop long (max 160 car.)'),
  sections:         z.array(ContentSectionSchema).min(1),
  local_data:       RequiredLocalDataSchema,
  image_url:        z.string().url().optional(),  // photo réelle (Pexels) — sinon fallback par slug
});

// ─── Page de zone desservie ───────────────────────────────────────────────────

const ServiceAreaPageSchema = z
  .object({
    city:            z.string().min(1),
    nav_label:       z.string().max(20, 'nav_label doit être court pour le menu'),
    neighborhoods:   z.array(z.string()).min(1, 'Au moins 1 quartier requis'),
    local_context:   z.string().min(50, 'local_context doit être substantiel (min 50 car.)'),
    faqs:            z.array(FaqSchema).optional(),
    local_landmarks: z.array(z.string()).optional(),
  })
  .refine(
    (d) => {
      let n = d.neighborhoods.length > 0 ? 1 : 0;
      if (d.local_context.trim().length >= 50) n++;
      if (d.faqs && d.faqs.length > 0)         n++;
      if (d.local_landmarks && d.local_landmarks.length > 0) n++;
      return n >= 2;
    },
    {
      message:
        'service_area doit avoir ≥2 champs de contenu local remplis (neighborhoods + local_context au minimum).',
    }
  );

// ─── Champ de formulaire ──────────────────────────────────────────────────────

const FormFieldSchema = z.object({
  name:     z.string().min(1),
  label:    z.string().min(1),
  type:     z.enum(['text', 'email', 'tel', 'textarea', 'select']),
  required: z.boolean().default(false),
  options:  z.array(z.string()).optional(),
});

// ─── Pages ────────────────────────────────────────────────────────────────────

const PagesSchema = z.object({
  home: z.object({
    hero_title:    z.string().min(1),
    hero_subtitle: z.string().min(1),
    intro:         z.string().min(1),
    sections:      z.array(HomeSectionSchema),
  }),
  services:      z.array(ServicePageSchema).min(1, 'Au moins 1 page service requise'),
  service_areas: z.array(ServiceAreaPageSchema).min(1, 'Au moins 1 zone desservie requise'),
  contact: z.object({
    intro:       z.string().min(1),
    form_fields: z.array(FormFieldSchema).min(1),
  }),
});

// ─── Config principal ─────────────────────────────────────────────────────────

export const SiteConfigSchema = z.object({
  domain: z.string().min(1),
  mode:   z.enum(['demo', 'production']),
  type:   z.enum(['demo', 'client', 'rent']),

  business: z.object({
    name:          z.string().min(1),
    phone:         z.string().min(1),
    email:         z.string().email().optional(),
    address:       z.string().min(1),
    hours:         z.string().min(1),
    service_areas: z.array(z.string()).min(1),
  }),

  branding: z.object({
    logo_url:        z.string().url().optional(),
    hero_image_url:  z.string().url().optional(),
    primary_color:   HexColor,
    secondary_color: HexColor,
    tagline:         z.string().min(1),
  }),

  niche: z.string().min(1),
  city:  z.string().min(1),
  pages: PagesSchema,

  local_data: LocalDataSchema,
});

// ─── Types exportés ───────────────────────────────────────────────────────────

export type SiteConfig      = z.infer<typeof SiteConfigSchema>;
export type ServicePage     = z.infer<typeof ServicePageSchema>;
export type ServiceAreaPage = z.infer<typeof ServiceAreaPageSchema>;
export type HomeSection     = z.infer<typeof HomeSectionSchema>;
export type FormField       = z.infer<typeof FormFieldSchema>;
export type LocalData       = z.infer<typeof LocalDataSchema>;
export type Faq             = z.infer<typeof FaqSchema>;
