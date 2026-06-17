#!/usr/bin/env node
/**
 * Génère les images de marque d'un site local à partir de son config.json.
 * Usage : node dist/generate.js <path/to/config.json> <output-dir>
 *
 * Produit :
 *   {slug}-hero.png     — 1200×630  (OpenGraph / hero du site)
 *   {slug}-banner.png   — 1200×300  (bannière secondaire)
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';

// ─── Types minimaux (évite d'importer le package db côté images) ──────────────

interface Branding {
  primary_color:   string;
  secondary_color: string;
  tagline:         string;
  logo_url?:       string;
}
interface Business {
  name:  string;
  phone: string;
  city?: string;
}
interface SiteConfig {
  domain:   string;
  niche:    string;
  city:     string;
  business: Business;
  branding: Branding;
}

// ─── Chargement de police (Inter embarquée localement — aucun réseau) ─────────

const FONTS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'fonts');

function loadFont(file: string): ArrayBuffer {
  const buf = fs.readFileSync(path.join(FONTS_DIR, file));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

// ─── Templates JSX-like (Satori attend des objets React.ReactElement) ─────────

function heroElement(config: SiteConfig) {
  const { business, branding, niche, city } = config;
  return {
    type: 'div',
    props: {
      style: {
        width: '100%', height: '100%',
        display: 'flex', flexDirection: 'column' as const,
        backgroundColor: branding.primary_color,
        color: '#ffffff',
        padding: '60px 80px',
        justifyContent: 'space-between',
      },
      children: [
        // En-tête : nom + tagline
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' as const },
            children: [
              {
                type: 'div',
                props: {
                  style: { fontSize: 52, fontWeight: 700, lineHeight: 1.1, marginBottom: 16 },
                  children: business.name,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 28, color: 'rgba(255,255,255,0.75)', fontWeight: 400 },
                  children: branding.tagline,
                },
              },
            ],
          },
        },
        // Pied : niche + ville + téléphone
        {
          type: 'div',
          props: {
            style: {
              display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end',
            },
            children: [
              {
                type: 'div',
                props: {
                  style: { display: 'flex', flexDirection: 'column' as const },
                  children: [
                    {
                      type: 'div',
                      props: {
                        style: {
                          fontSize: 22, fontWeight: 600,
                          backgroundColor: branding.secondary_color,
                          color: '#ffffff',
                          padding: '8px 20px', borderRadius: 8,
                          marginBottom: 12,
                          display: 'flex', alignSelf: 'flex-start',
                        },
                        children: `${niche.toUpperCase()} — ${city.toUpperCase()}`,
                      },
                    },
                    {
                      type: 'div',
                      props: {
                        style: { fontSize: 28, fontWeight: 700, color: branding.secondary_color },
                        children: business.phone,
                      },
                    },
                  ],
                },
              },
              {
                type: 'div',
                props: {
                  style: {
                    fontSize: 18, color: 'rgba(255,255,255,0.5)',
                    textAlign: 'right' as const,
                  },
                  children: config.domain,
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function bannerElement(config: SiteConfig) {
  const { business, branding } = config;
  return {
    type: 'div',
    props: {
      style: {
        width: '100%', height: '100%',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: branding.primary_color,
        color: '#ffffff',
        padding: '0 60px',
      },
      children: [
        {
          type: 'div',
          props: {
            style: { display: 'flex', flexDirection: 'column' as const },
            children: [
              {
                type: 'div',
                props: {
                  style: { fontSize: 36, fontWeight: 700 },
                  children: business.name,
                },
              },
              {
                type: 'div',
                props: {
                  style: { fontSize: 20, color: 'rgba(255,255,255,0.70)', marginTop: 8 },
                  children: branding.tagline,
                },
              },
            ],
          },
        },
        {
          type: 'div',
          props: {
            style: {
              fontSize: 32, fontWeight: 700,
              color: branding.secondary_color,
              borderLeft: `4px solid ${branding.secondary_color}`,
              paddingLeft: 24,
            },
            children: business.phone,
          },
        },
      ],
    },
  };
}

// ─── Rendu PNG via Satori + Resvg ─────────────────────────────────────────────

async function renderPng(
  element: object,
  width:   number,
  height:  number,
  fonts:   { name: string; data: ArrayBuffer; weight: 400 | 700; style: 'normal' }[]
): Promise<Buffer> {
  const svg = await satori(element as Parameters<typeof satori>[0], {
    width, height, fonts,
  });
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: width } });
  return Buffer.from(resvg.render().asPng());
}

// ─── Slugification du nom de domaine pour les noms de fichiers ────────────────

function domainSlug(domain: string): string {
  return domain.replace(/\./g, '-').replace(/[^a-z0-9-]/gi, '');
}

// ─── Point d'entrée ───────────────────────────────────────────────────────────

async function main() {
  const [,, configPath, outputDir = './public/images/brand'] = process.argv;

  if (!configPath) {
    console.error('Usage: generate-images <config.json> [output-dir]');
    process.exit(1);
  }

  if (!fs.existsSync(configPath)) {
    console.error(`Config introuvable : ${configPath}`);
    process.exit(1);
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8')) as SiteConfig;
  fs.mkdirSync(outputDir, { recursive: true });

  console.log(`[images] Chargement de la police Inter (locale)…`);
  const fonts = [
    { name: 'Inter', data: loadFont('Inter-Regular.ttf'), weight: 400 as const, style: 'normal' as const },
    { name: 'Inter', data: loadFont('Inter-Bold.ttf'),    weight: 700 as const, style: 'normal' as const },
  ];

  const slug = domainSlug(config.domain);

  console.log(`[images] Génération hero 1200×630…`);
  const heroPng = await renderPng(heroElement(config), 1200, 630, fonts);
  const heroPath = path.join(outputDir, `${slug}-hero.png`);
  fs.writeFileSync(heroPath, heroPng);
  console.log(`[images] ✓ ${heroPath}`);

  console.log(`[images] Génération bannière 1200×300…`);
  const bannerPng = await renderPng(bannerElement(config), 1200, 300, fonts);
  const bannerPath = path.join(outputDir, `${slug}-banner.png`);
  fs.writeFileSync(bannerPath, bannerPng);
  console.log(`[images] ✓ ${bannerPath}`);

  console.log(`[images] Images générées dans ${outputDir}`);
}

main().catch((err) => {
  console.error('[images] Erreur :', err);
  process.exit(1);
});
