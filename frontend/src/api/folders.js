import client from './client';

export const getFolders = () => client.get('/folders');

export const createFolder = (name, parentId) =>
  client.post('/folders', { name, parent_id: parentId || null });

export const renameFolder = (id, name) =>
  client.put(`/folders/${id}`, { name });

export const deleteFolder = (id) => client.delete(`/folders/${id}`);