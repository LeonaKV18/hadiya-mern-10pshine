import * as authApi from './auth';
import client from './client';

jest.mock('./client', () => ({
  __esModule: true,
  default: { get: jest.fn(() => Promise.resolve({ data: {} })), post: jest.fn(() => Promise.resolve({ data: {} })) },
}));

describe('auth api', () => {
  beforeEach(() => jest.clearAllMocks());

  it('register posts the credentials', () => {
    authApi.register('jane', 'jane@example.com', 'Password1');
    expect(client.post).toHaveBeenCalledWith('/auth/register', {
      username: 'jane', email: 'jane@example.com', password: 'Password1',
    });
  });

  it('login posts email and password', () => {
    authApi.login('jane@example.com', 'Password1');
    expect(client.post).toHaveBeenCalledWith('/auth/login', { email: 'jane@example.com', password: 'Password1' });
  });

  it('verifyEmail gets with the token in the query', () => {
    authApi.verifyEmail('tok123');
    expect(client.get).toHaveBeenCalledWith('/auth/verify-email?token=tok123');
  });

  it('resendVerification posts the email', () => {
    authApi.resendVerification('jane@example.com');
    expect(client.post).toHaveBeenCalledWith('/auth/resend-verification', { email: 'jane@example.com' });
  });
});