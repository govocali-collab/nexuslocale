import Anthropic from '@anthropic-ai/sdk';

// Générateur de « beaux sites » — porté de SiteDrop, adapté à Pexels.
// Produit UN document HTML autonome, design-first, via Claude Opus 4.8.

const GENERATION_MODEL = 'claude-opus-4-8';

export interface SiteBrief {
  businessName: string;
  industry: string;
  description: string;
  details?: string | undefined;
}

const SYSTEM_PROMPT = `You are an elite web designer and front-end engineer who builds high-converting marketing websites for local businesses (salons, clinics, restaurants, trades, gyms, law firms, etc.).

You produce ONE complete, self-contained, production-quality HTML document per request.

Hard requirements:
- Output a SINGLE valid HTML5 document and NOTHING else. No markdown fences, no commentary before or after.
- Load Tailwind via <script src="https://cdn.tailwindcss.com"></script> in <head>. Do not use any other build step.
- Make it fully responsive (mobile-first) and accessible (semantic landmarks, alt text, aria labels, sufficient contrast).
- Include: a sticky nav, a strong hero with a clear primary CTA, a services/offer section, social proof (testimonials), an about/why-us section, a contact section with a form (action="#"), and a footer.
- Use real, specific, persuasive copy tailored to the business — never lorem ipsum, never placeholder brackets. Write in the language of the business (French for Québec businesses).
- Add tasteful micro-interactions with Tailwind transitions and a small amount of inline vanilla JS (mobile menu toggle, smooth scroll). Keep JS minimal and dependency-free.

Design quality bar — avoid generic AI aesthetics:
- NEVER use overused fonts (Inter, Roboto, Arial, system defaults) or cliché purple-gradient-on-white looks.
- Choose a cohesive palette and a distinctive Google Font pairing that fits THIS industry (load via <link> in head).
- Give the page a unique, context-appropriate character. A law firm and a tattoo studio should look nothing alike.

Photos:
- If a list of REAL IMAGE URLS is provided, use ONLY those exact URLs as <img>/background images — hotlink them directly, do not alter the URL. Place them in the hero, services, gallery, and about sections. Always use object-cover and meaningful alt text, and add a subtle overlay where text sits on a photo for contrast.
- If NO image URLs are provided, do NOT invent image URLs or use placeholder image services (they break). Design a strong photo-free layout using color, typography, gradients, and CSS/SVG shapes instead.

No embeds:
- NEVER use <iframe> elements — no Google Maps embeds, no embedded frames, no third-party widgets. They render unreliably and break the preview.
- For a location/map, design a styled address card and a button/link to Google Maps using an absolute URL: https://www.google.com/maps/search/?api=1&query=<urlencoded address>. Never embed a map.

Return only the HTML document, starting with <!DOCTYPE html>.`;

interface StockImage { url: string; alt: string; }

// Pexels (indexé en anglais) — on traduit l'industrie en mot-clé photo EN.
async function imageSearchTerm(anthropic: Anthropic, brief: SiteBrief): Promise<string> {
  try {
    const m = await anthropic.messages.create({
      model: GENERATION_MODEL,
      max_tokens: 24,
      system:
        "Output ONLY a 1-2 word English stock-photo search term for the given local business type — the physical subject a photographer would shoot. No quotes, no punctuation, no business name. Examples: 'Plombier' -> plumbing, 'Coiffeur' -> hair salon, 'Garagiste' -> auto repair.",
      messages: [{ role: 'user', content: `Business type: ${brief.industry}` }],
    });
    const term = m.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text).join('').replace(/["'\n.]/g, '').trim();
    return term || brief.industry;
  } catch {
    return brief.industry;
  }
}

async function fetchPexels(query: string, count: number): Promise<StockImage[]> {
  const key = process.env.PEXELS_API_KEY;
  if (!key) return [];
  try {
    const params = new URLSearchParams({ query, orientation: 'landscape', per_page: String(count) });
    const res = await fetch(`https://api.pexels.com/v1/search?${params}`, { headers: { Authorization: key } });
    if (!res.ok) return [];
    const data = await res.json() as { photos?: { src: { landscape: string; large: string }; alt?: string }[] };
    return (data.photos ?? []).map((p) => ({ url: p.src.landscape ?? p.src.large, alt: p.alt || query }));
  } catch {
    return [];
  }
}

function briefToPrompt(brief: SiteBrief, images: StockImage[], feedback?: string): string {
  const lines = [
    `Business name: ${brief.businessName}`,
    `Industry: ${brief.industry}`,
    `What they do: ${brief.description}`,
  ];
  if (brief.details) lines.push(`Extra details / preferences: ${brief.details}`);
  if (images.length) {
    lines.push(
      `\nREAL IMAGE URLS (use ONLY these, hotlink directly, distribute across hero/services/gallery/about):\n` +
        images.map((img, i) => `${i + 1}. ${img.url}  (alt: ${img.alt})`).join('\n'),
    );
  }
  if (feedback) {
    lines.push(`\nThis is a REVISION of an existing site. Apply this feedback while keeping everything else intact:\n${feedback}`);
  }
  lines.push('\nBuild the complete website now.');
  return lines.join('\n');
}

function extractHtml(text: string): string {
  const fence = text.match(/```(?:html)?\s*([\s\S]*?)```/i);
  const raw = fence ? fence[1]! : text;
  const start = raw.search(/<!DOCTYPE html>/i);
  return (start >= 0 ? raw.slice(start) : raw).trim();
}

function stripFrames(html: string): string {
  return html
    .replace(/<iframe[\s\S]*?<\/iframe>/gi, '')
    .replace(/<iframe[^>]*\/?>/gi, '');
}

export async function generateBeautifulHtml(
  brief: SiteBrief,
  feedback?: string,
): Promise<{ html: string }> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY manquant.');
  const anthropic = new Anthropic({ apiKey });

  const term   = await imageSearchTerm(anthropic, brief);
  const images = await fetchPexels(term, 6);

  const stream = anthropic.messages.stream({
    model: GENERATION_MODEL,
    max_tokens: 32000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: briefToPrompt(brief, images, feedback) }],
  });
  const message = await stream.finalMessage();

  const text = message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text).join('');

  return { html: stripFrames(extractHtml(text)) };
}
