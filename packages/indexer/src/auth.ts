import { JWT } from 'google-auth-library';

export const GSC_SCOPES = [
  'https://www.googleapis.com/auth/webmasters',
  'https://www.googleapis.com/auth/siteverification',
];

export function makeJwt(): JWT {
  const email  = process.env['GSC_CLIENT_EMAIL'];
  const rawKey = process.env['GSC_PRIVATE_KEY'];
  if (!email || !rawKey) {
    throw new Error(
      'GSC_CLIENT_EMAIL et GSC_PRIVATE_KEY requis dans .env\n' +
      'Voir apps/indexer/README.md → Setup Google Service Account.'
    );
  }
  return new JWT({ email, key: rawKey.replace(/\\n/g, '\n'), scopes: GSC_SCOPES });
}

export async function getGoogleToken(): Promise<string> {
  const res = await makeJwt().getAccessToken();
  if (!res.token) throw new Error('Token Google vide — vérifiez GSC_CLIENT_EMAIL / GSC_PRIVATE_KEY');
  return res.token;
}

export function hasGscCredentials(): boolean {
  return !!(process.env['GSC_CLIENT_EMAIL'] && process.env['GSC_PRIVATE_KEY']);
}
