import * as client from 'openid-client';
import { headers } from 'next/headers';
import { saveAuth } from '@/lib/auth';
import { hash, secret } from '@/lib/crypto';
import { getBaseUrl } from '@/lib/get-base-url';
import { createSecureToken } from '@/lib/jwt';
import { getOidcConfig, getOidcSharedUsername, oidcEnabled } from '@/lib/oidc';
import redis from '@/lib/redis';
import { getUserByUsername } from '@/queries/prisma';

function htmlResponse(body: string, status = 200) {
  return new Response(body, { status, headers: { 'Content-Type': 'text/html; charset=utf-8' } });
}

function errorPage(message: string) {
  return htmlResponse(
    `<!doctype html><meta charset="utf-8"><p>Login fehlgeschlagen: ${message}</p><p><a href="/login">Zurück zum Login</a></p>`,
    400,
  );
}

export async function GET(request: Request) {
  if (!oidcEnabled()) {
    return new Response('OIDC is not configured', { status: 404 });
  }

  const cookieHeader = request.headers.get('cookie') || '';
  const match = cookieHeader.match(/(?:^|;\s*)umami\.oidc=([^;]+)/);

  if (!match) {
    return errorPage('Login-Session abgelaufen, bitte erneut versuchen.');
  }

  let saved: { codeVerifier: string; state: string; nonce: string };

  try {
    saved = JSON.parse(decodeURIComponent(match[1]));
  } catch {
    return errorPage('Ungültige Login-Session.');
  }

  const config = await getOidcConfig();
  const baseUrl = getBaseUrl(await headers());
  const incomingUrl = new URL(request.url);
  const currentUrl = new URL('/api/auth/oidc/callback', baseUrl);
  currentUrl.search = incomingUrl.search;

  let claims;

  try {
    const tokens = await client.authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: saved.codeVerifier,
      expectedState: saved.state,
      expectedNonce: saved.nonce,
    });

    claims = tokens.claims();
  } catch (e: any) {
    console.error('OIDC token exchange failed', {
      message: e?.message,
      error: e?.error,
      error_description: e?.error_description,
      cause: e?.cause,
      redirect_uri: currentUrl.toString(),
    });
    return errorPage(e?.error_description || e?.error || e?.message || 'OIDC-Austausch fehlgeschlagen.');
  }

  if (!claims?.sub) {
    return errorPage('Keine gültigen Nutzerdaten von Authentik erhalten.');
  }

  // Shared-account model: Authentik already gates this application to the
  // "Fachschaft Informatik Vorstand" group. Anyone who completes the OIDC
  // flow successfully is logged into the one shared Umami admin account.
  const username = getOidcSharedUsername();
  const user = await getUserByUsername(username, { includePassword: true });

  if (!user) {
    return errorPage(`Shared-Account "${username}" existiert nicht in Umami.`);
  }

  const { id, role } = user;
  const pwd = hash(user.password);

  let token: string;

  if (redis.enabled) {
    token = await saveAuth({ userId: id, role, pwd });
  } else {
    token = createSecureToken({ userId: id, role, pwd }, secret());
  }

  const res = htmlResponse(
    `<!doctype html><meta charset="utf-8"><script>
      localStorage.setItem('umami.auth', JSON.stringify(${JSON.stringify(token)}));
      location.replace('/');
    </script><p>Login erfolgreich, du wirst weitergeleitet…</p>`,
  );

  res.headers.append('Set-Cookie', 'umami.oidc=; Path=/api/auth/oidc; Max-Age=0');

  return res;
}
