import client from './client';

export const getProfile = () => client.get('/users/me');

export const updatePreferences = (preferences) =>
  client.patch('/users/preferences', preferences);

export const deleteAccount = () => client.delete('/users/me');