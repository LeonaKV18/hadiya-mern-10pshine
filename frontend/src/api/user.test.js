import * as userApi from './user';
import client from './client';

jest.mock('./client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(() => Promise.resolve({ data: {} })),
    patch: jest.fn(() => Promise.resolve({ data: {} })),
    delete: jest.fn(() => Promise.resolve({ data: {} })),
  },
}));

describe('user api', () => {
  beforeEach(() => jest.clearAllMocks());

  it('getProfile gets /users/me', () => {
    userApi.getProfile();
    expect(client.get).toHaveBeenCalledWith('/users/me');
  });

  it('updatePreferences patches the preferences', () => {
    userApi.updatePreferences({ theme: 'dark' });
    expect(client.patch).toHaveBeenCalledWith('/users/preferences', { theme: 'dark' });
  });

  it('deleteAccount deletes /users/me', () => {
    userApi.deleteAccount();
    expect(client.delete).toHaveBeenCalledWith('/users/me');
  });
});