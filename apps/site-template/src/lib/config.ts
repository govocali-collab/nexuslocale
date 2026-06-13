import fs from 'node:fs';
import path from 'node:path';
import { SiteConfigSchema, type SiteConfig } from '@/schema/config';

let _config: SiteConfig | undefined;

export function getConfig(): SiteConfig {
  if (_config) return _config;

  // Priorité 1 : variable d'env JSON encodée (pour Vercel sans fichier commité)
  if (process.env.SITE_CONFIG_JSON) {
    const raw = JSON.parse(
      Buffer.from(process.env.SITE_CONFIG_JSON, 'base64').toString('utf8')
    );
    _config = SiteConfigSchema.parse(raw);
    return _config;
  }

  // Priorité 2 : chemin explicite
  const configPath =
    process.env.SITE_CONFIG_PATH ??
    path.join(process.cwd(), '../../configs/excavation-granby.json');

  if (!fs.existsSync(configPath)) {
    throw new Error(
      `Config introuvable : ${configPath}\n` +
      `Définissez SITE_CONFIG_PATH ou SITE_CONFIG_JSON avant de lancer Next.js.`
    );
  }

  const raw = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  const result = SiteConfigSchema.safeParse(raw);

  if (!result.success) {
    const issues = result.error.issues
      .map((i) => `  • ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Config invalide :\n${issues}`);
  }

  _config = result.data;
  return _config;
}

export function slugifyCity(city: string): string {
  return city
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}
