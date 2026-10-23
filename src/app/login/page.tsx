import type { Metadata } from 'next';
import { oidcEnabled, passwordLoginDisabled } from '@/lib/oidc';
import { LoginPage } from './LoginPage';

export const dynamic = 'force-dynamic';

export default async function () {
  if (process.env.DISABLE_LOGIN || process.env.CLOUD_MODE) {
    return null;
  }

  return <LoginPage oidcEnabled={oidcEnabled()} passwordLoginDisabled={passwordLoginDisabled()} />;
}

export const metadata: Metadata = {
  title: 'Login',
};
