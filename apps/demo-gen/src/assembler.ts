import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SiteConfigSchema } from '../../site-template/src/schema/config.js';
import type { GeneratedContent, ProspectFull } from './types.js';
import { demoSubdomain, nicheColors, nicheHeroImage } from './branding.js';

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../../../configs',
);

function formatHours(raw: string | null | undefined): string {
  if (raw) return raw;
  return 'Lun–Ven : 7h–17h | Sam : 8h–12h | Dim : Fermé';
}

// Tente de corriger les problèmes courants avant validation
function autoFix(generated: GeneratedContent): GeneratedContent {
  return {
    ...generated,
    pages: {
      ...generated.pages,
      services: generated.pages.services.map((svc) => ({
        ...svc,
        // Tronque les champs soumis à des limites de caractères
        nav_label:        svc.nav_label.slice(0, 30),
        meta_title:       svc.meta_title.slice(0, 60),
        meta_description: svc.meta_description.slice(0, 160),
        // Garantit ≥2 champs local_data
        local_data: ensureLocalData(svc.local_data),
      })),
      service_areas: generated.pages.service_areas.map((sa) => ({
        ...sa,
        nav_label: sa.nav_label.slice(0, 20),
        neighborhoods: sa.neighborhoods.length > 0
          ? sa.neighborhoods
          : [`Centre de ${sa.city}`],
      })),
    },
  };
}

function ensureLocalData(
  ld: GeneratedContent['pages']['services'][number]['local_data'],
): typeof ld {
  // Compte les champs non-vides
  let count = 0;
  if (ld.neighborhoods      && ld.neighborhoods.length > 0)       count++;
  if (ld.price_context      && ld.price_context.trim().length > 0) count++;
  if (ld.faqs               && ld.faqs.length > 0)                count++;
  if (ld.competitor_context && ld.competitor_context.trim().length > 0) count++;
  if (ld.local_landmarks    && ld.local_landmarks.length > 0)     count++;

  if (count >= 2) return ld;

  // Injecte un price_context générique si manquant
  return {
    ...ld,
    price_context:
      ld.price_context ?? 'Estimé gratuit sur demande — prix établis selon les conditions du terrain.',
    faqs: ld.faqs ?? [
      {
        q: 'Comment obtenir un estimé?',
        a: 'Contactez-nous par téléphone ou via le formulaire — nous répondons sous 24h les jours ouvrables.',
      },
    ],
  };
}

export interface AssembledConfig {
  filePath: string;
  domain:   string;
  pages:    number;
  zones:    number;
}

export function assembleAndWrite(
  prospect: ProspectFull,
  generated: GeneratedContent,
): AssembledConfig {
  const colors = nicheColors(prospect.niche);

  const raw = {
    domain: demoSubdomain(prospect.business_name),
    mode:   'demo',
    type:   'demo',

    business: {
      name:          prospect.business_name,
      phone:         prospect.phone ?? 'N/A',
      address:       prospect.address ?? `${prospect.city}, QC, Canada`,
      hours:         formatHours(prospect.opening_hours),
      service_areas: generated.pages.service_areas.map((sa) => sa.city),
      ...(prospect.website ? { email: undefined } : {}),
    },

    branding: {
      primary_color:   generated.branding.primary_color || colors.primary,
      secondary_color: generated.branding.secondary_color || colors.secondary,
      tagline:         generated.branding.tagline,
      hero_image_url:  nicheHeroImage(prospect.niche),
    },

    niche: prospect.niche,
    city:  prospect.city,
    pages: generated.pages,
    local_data: generated.local_data,
  };

  // Première validation
  let result = SiteConfigSchema.safeParse(raw);

  // Auto-correction + re-validation
  if (!result.success) {
    const fixed = autoFix(generated);
    const rawFixed = { ...raw, pages: fixed.pages, local_data: fixed.local_data };
    result = SiteConfigSchema.safeParse(rawFixed);

    if (!result.success) {
      const errors = result.error.errors
        .slice(0, 5)
        .map((e) => `  • ${e.path.join('.')}: ${e.message}`)
        .join('\n');
      throw new Error(`Config invalide après auto-correction :\n${errors}`);
    }
  }

  // Écriture du fichier
  fs.mkdirSync(ROOT, { recursive: true });
  const slug     = demoSubdomain(prospect.business_name).replace('.nexuslocale.com', '');
  const filename = `${slug}.json`;
  const filePath = path.join(ROOT, filename);

  fs.writeFileSync(filePath, JSON.stringify(result.data, null, 2), 'utf8');

  return {
    filePath,
    domain: result.data.domain,
    pages:  result.data.pages.services.length,
    zones:  result.data.pages.service_areas.length,
  };
}
