import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Auth client — utilise la clé anon + cookies de session. Côté serveur seulement. */
export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env['SUPABASE_URL']!,
    process.env['SUPABASE_ANON_KEY']!,
    {
      cookies: {
        getAll:  () => cookieStore.getAll(),
        setAll: (cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) => {
          try {
            // CookieOptions (supabase) vs ResponseCookie (Next.js) — structurally compatible at runtime
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options as never)
            );
          } catch {
            // En lecture seule dans les Server Components — pas d'erreur critique
          }
        },
      },
    },
  );
}

/** Retourne l'utilisateur connecté, ou null. */
export async function getUser() {
  const supabase = await createAuthClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}
