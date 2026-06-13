import { createClient } from '@supabase/supabase-js';

/** Client Supabase avec service role key — bypass RLS, serveur uniquement.
 *  Ne jamais exporter ni passer au client browser. */
export function createAdminClient() {
  return createClient(
    process.env['SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_KEY']!,
    { auth: { persistSession: false } },
  );
}
