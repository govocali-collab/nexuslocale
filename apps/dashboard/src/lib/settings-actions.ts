'use server';

import { createAdminClient } from './admin';
import { DEFAULT_CALL_SCRIPT } from './call-script-default';

const CALL_SCRIPT_KEY = 'call_script';

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
