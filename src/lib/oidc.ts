import * as client from 'openid-client';

let configPromise: Promise<client.Configuration> | null = null;

export function oidcEnabled() {
  return Boolean(process.env.OIDC_ISSUER && process.env.OIDC_CLIENT_ID && process.env.OIDC_CLIENT_SECRET);
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
