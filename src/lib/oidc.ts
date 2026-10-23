import * as client from 'openid-client';

let configPromise: Promise<client.Configuration> | null = null;

export function oidcEnabled() {
  return Boolean(
    process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET,
  );
}

/**
 * DISABLE_PASSWORD_LOGIN=1 schaltet den Passwort-Login ab (Formular und POST /api/auth/login).
 * Wirkt nur, wenn OIDC konfiguriert ist — sonst wäre niemand mehr anmeldbar.
 * Wird zur Laufzeit gelesen (Server-Prop), nicht zur Build-Zeit.
 */
export function passwordLoginDisabled() {
  const flag = (process.env.DISABLE_PASSWORD_LOGIN ?? '').trim().toLowerCase();

  return oidcEnabled() && ['1', 'true', 'yes'].includes(flag);
}

export function getOidcConfig() {
  if (!configPromise) {
    configPromise = client.discovery(
      new URL(process.env.OIDC_ISSUER as string),
      process.env.OIDC_CLIENT_ID as string,
      process.env.OIDC_CLIENT_SECRET as string,
    );
  }

  return configPromise;
}

export function getOidcSharedUsername() {
  return process.env.OIDC_SHARED_USERNAME || 'vorstand';
}
