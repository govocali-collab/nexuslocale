import Anthropic from '@anthropic-ai/sdk';
import type { ProspectFull, GeneratedContent } from './types.js';
import { buildSystemPrompt, buildUserPrompt } from './prompt.js';

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 8192; // max pour claude-sonnet-4-6

export async function generateContent(
  prospect: ProspectFull,
  apiKey: string,
  hintOnRetry?: string,
): Promise<GeneratedContent> {
  const client = new Anthropic({ apiKey });

  const userPrompt = hintOnRetry
    ? `${buildUserPrompt(prospect)}\n\n⚠ Correction requise : ${hintOnRetry}`
    : buildUserPrompt(prospect);

  const response = await client.messages.create({
    model:      MODEL,
    max_tokens: MAX_TOKENS,
    system:     buildSystemPrompt(),
    messages:   [{ role: 'user', content: userPrompt }],
  });

  const block = response.content[0];
  const text  = block?.type === 'text' ? block.text.trim() : '';

  // Extrait le JSON même si le modèle a ajouté du texte autour
  const raw = extractJson(text);
  if (!raw) throw new Error(`Réponse non-JSON reçue :\n${text.slice(0, 300)}`);

  return raw as GeneratedContent;
}

function extractJson(text: string): unknown | null {
  // Cas idéal : la réponse entière est du JSON
  try {
    return JSON.parse(text);
  } catch { /* continue */ }

  // Fallback : extraire le premier objet JSON de la réponse
  const start = text.indexOf('{');
  const end   = text.lastIndexOf('}');
  if (start === -1 || end === -1) return null;

  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
}
