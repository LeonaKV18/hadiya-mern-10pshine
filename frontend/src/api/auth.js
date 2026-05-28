import client from './client';

export const register = (username, email, password) =>
  client.post('/auth/register', { username, email, password });

export const login = (email, password) =>
  client.post('/auth/login', { email, password });

export const verifyEmail = (token) =>
  client.get(`/auth/verify-email?token=${token}`);

export const resendVerification = (email) =>
  client.post('/auth/resend-verification', { email });