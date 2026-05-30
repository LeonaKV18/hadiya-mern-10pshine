import client from './client';

export const getNotes = () => client.get('/notes');

export const getTrashedNotes = () => client.get('/notes/trash');

export const getNoteById = (id) => client.get(`/notes/${id}`);

export const searchNotes = (query) =>
  client.get(`/notes/search?q=${encodeURIComponent(query)}`);

export const createNote = (title, content, folderId) =>
  client.post('/notes', { title, content, folder_id: folderId || null });

export const updateNote = (id, title, content, folderId) =>
  client.put(`/notes/${id}`, {
    title,
    content,
    folder_id: folderId !== undefined ? folderId : undefined,
  });

export const autosaveNote = (id, { title, content }) =>
  client.patch(`/notes/${id}/autosave`, { title, content });

export const togglePin = (id) => client.patch(`/notes/${id}/pin`);

export const trashNote = (id) => client.delete(`/notes/${id}`);

export const restoreNote = (id) => client.post(`/notes/${id}/restore`);

export const permanentlyDeleteNote = (id) =>
  client.delete(`/notes/${id}/permanent`);

export const summarizeNote = (id) => client.post(`/notes/${id}/summarize`);

export const exportNote = (id, format) =>
  client.get(`/notes/${id}/export?format=${format}`, { responseType: 'blob' });