import * as client from 'openid-client';
import { headers } from 'next/headers';
import { getBaseUrl } from '@/lib/get-base-url';
import { getOidcConfig, oidcEnabled } from '@/lib/oidc';

export async function GET() {
  if (!oidcEnabled()) {
    return new Response('OIDC is not configured', { status: 404 });
  }

  const config = await getOidcConfig();
  const baseUrl = getBaseUrl(await headers());
  const redirectUri = new URL('/api/auth/oidc/callback', baseUrl).toString();

  const codeVerifier = client.randomPKCECodeVerifier();
  const codeChallenge = await client.calculatePKCECodeChallenge(codeVerifier);
  const state = client.randomState();
  const nonce = client.randomNonce();

  const authUrl = client.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri,
    scope: 'openid email profile',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    state,
    nonce,
  });

  const res = new Response(null, { status: 302, headers: { Location: authUrl.href } });

  const cookieValue = encodeURIComponent(JSON.stringify({ codeVerifier, state, nonce }));

  res.headers.append(
    'Set-Cookie',
    `umami.oidc=${cookieValue}; Path=/api/auth/oidc; Max-Age=300; HttpOnly; Secure; SameSite=Lax`,
  );

  return res;
}
