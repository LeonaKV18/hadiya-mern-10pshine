import client from './client';

export const getFolders = () => client.get('/folders');

export const createFolder = (name, parentId, color) =>
  client.post('/folders', { name, parent_id: parentId || null, color: color || null });

export const renameFolder = (id, name) =>
  client.put(`/folders/${id}`, { name });

export const updateFolder = (id, fields) =>
  client.put(`/folders/${id}`, fields);

export const deleteFolder = (id) => client.delete(`/folders/${id}`);