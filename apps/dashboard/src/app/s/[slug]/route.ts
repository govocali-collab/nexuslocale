import { createAdminClient } from '@/lib/admin';

// Hébergement public d'un site « beau » à /s/<slug> — aucune auth (site client).
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const db = createAdminClient();
  const { data } = await db
    .from('published_sites')
    .select('html')
    .eq('slug', slug)
    .maybeSingle();

  if (!data?.html) {
    return new Response('Site introuvable.', { status: 404 });
  }
  return new Response(data.html as string, {
    headers: { 'content-type': 'text/html; charset=utf-8' },
  });
}
