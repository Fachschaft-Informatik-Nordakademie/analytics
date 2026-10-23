import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { parseRequest } from '@/lib/request';
import { POST } from './route';

vi.mock('@/lib/request', () => ({
  parseRequest: vi.fn(),
}));

vi.mock('@/lib/auth', () => ({ saveAuth: vi.fn() }));

vi.mock('@/lib/redis', () => ({ default: { enabled: false } }));

vi.mock('@/queries/prisma', () => ({
  getAllUserTeams: vi.fn(),
  getUserByUsername: vi.fn(),
}));

const parseRequestMock = vi.mocked(parseRequest);

const OIDC_ENV = {
  OIDC_ISSUER: 'https://sso.example.test/application/o/analytics/',
  OIDC_CLIENT_ID: 'client',
  OIDC_CLIENT_SECRET: 'secret',
};

beforeEach(() => {
  parseRequestMock.mockReset();
  parseRequestMock.mockResolvedValue({ error: () => new Response(null, { status: 400 }) } as any);
  vi.stubEnv('DISABLE_PASSWORD_LOGIN', '');
  for (const [key, value] of Object.entries(OIDC_ENV)) vi.stubEnv(key, value);
});

afterEach(() => {
  vi.unstubAllEnvs();
});

const request = () => new Request('http://localhost/api/auth/login', { method: 'POST' });

test('POST answers 404 without touching the body when DISABLE_PASSWORD_LOGIN=1', async () => {
  vi.stubEnv('DISABLE_PASSWORD_LOGIN', '1');

  const response = await POST(request());

  expect(response.status).toBe(404);
  expect(parseRequestMock).not.toHaveBeenCalled();
});

test('POST behaves as before when the flag is unset', async () => {
  const response = await POST(request());

  expect(parseRequestMock).toHaveBeenCalledOnce();
  expect(response.status).toBe(400);
});

test('POST stays available when the flag is set but OIDC is not configured (no lockout)', async () => {
  vi.stubEnv('DISABLE_PASSWORD_LOGIN', '1');
  vi.stubEnv('OIDC_ISSUER', '');

  await POST(request());

  expect(parseRequestMock).toHaveBeenCalledOnce();
});
