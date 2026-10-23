import { expect, test } from 'vitest';
import { render, screen } from '@/test/render';
import { LoginForm } from './LoginForm';

test('shows the SSO button as "Studi Portal Anmeldung" next to the password form', () => {
  render(<LoginForm oidcEnabled passwordLoginDisabled={false} />);

  expect(screen.getByRole('button', { name: 'Studi Portal Anmeldung' })).toBeInTheDocument();
  expect(screen.getByTestId('input-password')).toBeInTheDocument();
});

test('hides the password form and the "oder" divider when password login is disabled', () => {
  render(<LoginForm oidcEnabled passwordLoginDisabled />);

  expect(screen.getByRole('button', { name: 'Studi Portal Anmeldung' })).toBeInTheDocument();
  expect(screen.queryByTestId('input-username')).not.toBeInTheDocument();
  expect(screen.queryByTestId('input-password')).not.toBeInTheDocument();
  expect(screen.queryByText('oder')).not.toBeInTheDocument();
});

test('without OIDC the password form stays, even if the flag is passed', () => {
  render(<LoginForm oidcEnabled={false} passwordLoginDisabled />);

  expect(screen.getByTestId('input-password')).toBeInTheDocument();
});
