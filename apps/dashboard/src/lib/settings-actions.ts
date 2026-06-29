'use server';

import { createAdminClient } from './admin';

const CALL_SCRIPT_KEY = 'call_script';

export const DEFAULT_CALL_SCRIPT = `Toi : Bonjour, est-ce que je parle au propriétaire?

Lui : Oui.

Toi : Bonjour, je m'appelle [Prénom]. Je vous dérange 30 secondes?

(Laisse-le répondre.)

Toi : En regardant {entreprise} sur Google, j'ai remarqué que votre site web est [absent / assez vieux / présente quelques problèmes].

(Pause.)

Lui : Ah oui?

Toi : Je suis curieux... est-ce que c'est quelque chose que vous aviez déjà remarqué ou pas vraiment?

(Laisse-le parler.)

Selon sa réponse :

« La raison de mon appel, c'est que j'ai préparé une idée de ce que votre présence web pourrait devenir. Je peux vous la montrer gratuitement sur Zoom. Ça prend une quinzaine de minutes, sans aucune obligation.

Vous êtes généralement plus disponible le matin ou en après-midi? »`;

export async function getCallScript(): Promise<string> {
  try {
    const db = createAdminClient();
    const { data } = await db.from('settings').select('value').eq('key', CALL_SCRIPT_KEY).maybeSingle();
    const v = data?.value as string | undefined;
    return v && v.trim() ? v : DEFAULT_CALL_SCRIPT;
  } catch {
    return DEFAULT_CALL_SCRIPT; // table pas encore migrée
  }
}

export async function saveCallScript(value: string): Promise<{ ok: boolean; error?: string | undefined }> {
  try {
    const db = createAdminClient();
    const { error } = await db
      .from('settings')
      .upsert({ key: CALL_SCRIPT_KEY, value, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'Erreur.' };
  }
}
