import Anthropic from '@anthropic-ai/sdk';
import type { AnalyzedProspect } from './types.js';

// Jugement IA de la qualité d'un site (style SiteDrop) : Claude ouvre le site
// via l'outil web_fetch et tranche moderne / vieux / cassé — plus fin que les
// règles codées (HTTPS, année copyright, builder…).

const MODEL = 'claude-sonnet-4-6'; // suffisant pour juger; moins cher qu'Opus

interface Judgment { status: 'modern' | 'outdated' | 'broken' | 'unknown'; reason: string; }

const SYSTEM = `Tu évalues la qualité du site web d'un commerce local pour un outil de prospection d'agence web.
Ouvre l'URL avec web_fetch et juge si le site est :
- "modern" : récent, responsive, professionnel, bien entretenu
- "outdated" : vieux, non responsive, design daté, pas mis à jour depuis des années, pas de HTTPS
- "broken" : ne charge pas, erreur, domaine parqué, page expirée/en construction
Réponds UNIQUEMENT par un objet JSON : {"status": "modern"|"outdated"|"broken", "reason": "une phrase courte en français"}.`;

async function judgeOne(url: string, apiKey: string): Promise<Judgment> {
  const anthropic = new Anthropic({ apiKey });
  try {
    const res = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 400,
      tools: [{ type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 2 }] as never,
      system: SYSTEM,
      messages: [{ role: 'user', content: `Évalue ce site : ${url}` }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text).join('');
    const m = text.match(/\{[\s\S]*\}/);
    if (!m) return { status: 'unknown', reason: '' };
    const j = JSON.parse(m[0]) as Partial<Judgment>;
    return { status: (j.status as Judgment['status']) ?? 'unknown', reason: j.reason ?? '' };
  } catch {
    return { status: 'unknown', reason: '' };
  }
}

// Enrichit les prospects « has_site » avec le jugement IA (mutation : pain_score + detected_issues).
// Lancer AVANT scoreAll pour que le prospect_score reflète le pain ajusté.
export async function judgeSites(
  prospects: AnalyzedProspect[],
  apiKey: string,
  max = 10,
): Promise<AnalyzedProspect[]> {
  const targets = prospects.filter((p) => p.web_presence === 'has_site' && p.website).slice(0, max);
  process.stdout.write(`[judge] Analyse IA de ${targets.length} site(s) « a un site »…\n`);
  for (const p of targets) {
    const j = await judgeOne(p.website as string, apiKey);
    if (j.status === 'broken') {
      p.detected_issues = [...p.detected_issues, `IA : site cassé — ${j.reason}`];
      p.pain_score = Math.min(100, p.pain_score + 40);
    } else if (j.status === 'outdated') {
      p.detected_issues = [...p.detected_issues, `IA : site vieux — ${j.reason}`];
      p.pain_score = Math.min(100, p.pain_score + 25);
    } else if (j.status === 'modern') {
      p.detected_issues = [...p.detected_issues, `IA : site moderne — ${j.reason}`];
    }
    process.stdout.write(`[judge]   ${p.business_name} → ${j.status}\n`);
  }
  return prospects;
}
