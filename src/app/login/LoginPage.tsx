'use client';
import { Column, Loading } from '@umami/react-zen';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useLoginQuery } from '@/components/hooks';
import { LoginForm } from './LoginForm';

export function LoginPage({ oidcEnabled }: { oidcEnabled: boolean }) {
  const { user, isLoading } = useLoginQuery();
  const router = useRouter();
  const searchParams = useSearchParams();
  const manual = searchParams.get('manual') === '1';
  const autoSso = oidcEnabled && !manual;

  useEffect(() => {
    if (user) {
      router.replace('/');
    }
  }, [user, router]);

  useEffect(() => {
    if (!isLoading && !user && autoSso) {
      window.location.href = '/api/auth/oidc';
    }
  }, [isLoading, user, autoSso]);

  if (isLoading || user || autoSso) {
    return <Loading placement="absolute" />;
  }

  return (
    <Column
      alignItems="center"
      justifyContent="flex-start"
      height="100vh"
      backgroundColor="surface-raised"
      style={{ paddingTop: '15vh' }}
    >
      <LoginForm oidcEnabled={oidcEnabled} />
    </Column>
  );
}
