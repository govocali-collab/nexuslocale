import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createAuthClient } from '@/lib/supabase/server';

async function signIn(formData: FormData) {
  'use server';
  const email    = formData.get('email')    as string;
  const password = formData.get('password') as string;
  const supabase = await createAuthClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect('/login?error=1');
  redirect('/app');
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f4f4f4]">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex justify-center">
          <Image
            src="/NexusLocale-logo.png"
            alt="NexusLocale"
            width={863}
            height={191}
            className="h-[46px] w-auto"
            priority
          />
        </div>

        <div className="card p-6">
          {error && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              Email ou mot de passe incorrect.
            </div>
          )}

          <form action={signIn} className="space-y-4">
            <div>
              <label htmlFor="email" className="label block mb-1">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a]
                           placeholder-[#a3a3a3] text-sm focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="admin@nexuslocale.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="label block mb-1">Mot de passe</label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                className="w-full rounded-md bg-[#fafafa] border-[#e5e5e5] text-[#0a0a0a]
                           placeholder-[#a3a3a3] text-sm focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              className="w-full rounded-md bg-[#5701f3] hover:bg-[#4801cc] px-4 py-2
                         text-sm font-medium text-white transition-colors"
            >
              Se connecter
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
