import { createClient } from '@supabase/supabase-js';
import type { Database } from './types.js';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

// Client typé — utiliser côté serveur uniquement (service_role)
export function createDb() {
  return createClient<Database>(
    requireEnv('SUPABASE_URL'),
    requireEnv('SUPABASE_SERVICE_KEY'),
    {
      auth: { persistSession: false },
      db: { schema: 'public' },
    }
  );
}

export type Db = ReturnType<typeof createDb>;

// Singleton partageable entre modules Node
let _db: Db | undefined;

export function getDb(): Db {
  if (!_db) _db = createDb();
  return _db;
}
