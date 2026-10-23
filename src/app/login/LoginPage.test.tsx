import { beforeEach, expect, test, vi } from 'vitest';
import { render, screen } from '@/test/render';
import { LoginPage } from './LoginPage';

vi.mock('@/components/hooks', async importOriginal => ({
  ...(await importOriginal<typeof import('@/components/hooks')>()),
  useLoginQuery: () => ({ user: null, isLoading: false }),
}));

beforeEach(() => {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { href: 'http://localhost/login' },
  });
});

test('?manual=1 shows the password form when password login is allowed', () => {
  render(<LoginPage oidcEnabled passwordLoginDisabled={false} />, { route: '/login?manual=1' });

  expect(screen.getByTestId('input-password')).toBeInTheDocument();
});

test('?manual=1 does not show the password form when password login is disabled', () => {
  render(<LoginPage oidcEnabled passwordLoginDisabled />, { route: '/login?manual=1' });

  expect(screen.queryByTestId('input-password')).not.toBeInTheDocument();
  expect(window.location.href).toBe('/api/auth/oidc');
});
