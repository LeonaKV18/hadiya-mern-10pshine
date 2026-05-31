const {
  getAllNotesByUser,
  getTrashedNotesByUser,
  getNoteById,
  getTrashedNoteById,
  searchNotesByUser,
  createNote,
  updateNote,
  deleteNote,
  restoreNote,
  permanentlyDeleteNote,
} = require('../models/noteModel');

// Fetch all active notes for a user
const fetchAllNotes = async (userId) => {
  return getAllNotesByUser(userId);
};

// Fetch all trashed notes for a user
const fetchTrashedNotes = async (userId) => {
  return getTrashedNotesByUser(userId);
};

// Fetch a single active note, verify ownership
const fetchNoteById = async (noteId, userId) => {
  const note = await getNoteById(noteId);

  if (!note) {
    const error = new Error('Note not found.');
    error.status = 404;
    throw error;
  }

  if (note.user_id !== userId) {
    const error = new Error('You do not have permission to access this note.');
    error.status = 403;
    throw error;
  }

  return note;
};

// Search active notes
const searchNotes = async (userId, query) => {
  if (!query || !query.trim()) {
    const error = new Error('Search query is required.');
    error.status = 400;
    throw error;
  }
  return searchNotesByUser(userId, query.trim());
};

// Create a new note
const createNewNote = async (userId, title, content, folderId) => {
  if (!title || !title.trim()) {
    const error = new Error('Title is required.');
    error.status = 400;
    throw error;
  }
  return createNote(userId, title.trim(), content, folderId);
};

// Update an existing note. title/content/folderId are all optional;
const updateExistingNote = async (noteId, userId, title, content, folderId) => {
  const note = await getNoteById(noteId);

  if (!note) {
    const error = new Error('Note not found.');
    error.status = 404;
    throw error;
  }

  if (note.user_id !== userId) {
    const error = new Error('You do not have permission to modify this note.');
    error.status = 403;
    throw error;
  }

  if (title === undefined && content === undefined && folderId === undefined) {
    const error = new Error('Provide at least a title, content, or folder to update.');
    error.status = 400;
    throw error;
  }

  const fields = {};
  if (title !== undefined) fields.title = title.trim();
  if (content !== undefined) fields.content = content;
  if (folderId !== undefined) fields.folder_id = folderId;

  return updateNote(note, fields);
};

// Autosave — updates content, and the title too if a non-empty one is sent
const autosaveNote = async (noteId, userId, { title, content }) => {
  const note = await getNoteById(noteId);

  if (!note) {
    const error = new Error('Note not found.');
    error.status = 404;
    throw error;
  }

  if (note.user_id !== userId) {
    const error = new Error('You do not have permission to modify this note.');
    error.status = 403;
    throw error;
  }

  const fields = {};
  if (content !== undefined) fields.content = content;
  if (typeof title === 'string' && title.trim()) fields.title = title.trim();

  return updateNote(note, fields);
};

// Toggle the pinned state of a note
// Toggle the pinned state of a note
const togglePinNote = async (noteId, userId) => {
  const note = await getNoteById(noteId);

  if (!note) {
    const error = new Error('Note not found.');
    error.status = 404;
    throw error;
  }

  if (note.user_id !== userId) {
    const error = new Error('You do not have permission to modify this note.');
    error.status = 403;
    throw error;
  }

  const currentPinned = Boolean(
    typeof note.getDataValue === 'function'
      ? note.getDataValue('is_pinned')
      : note.is_pinned
  );

  const nextPinned = !currentPinned;

  await note.update(
    { is_pinned: nextPinned },
    { fields: ['is_pinned'] }
  );

  await note.reload();

  return note;
};

// Soft delete a note (move to trash)
const trashNote = async (noteId, userId) => {
  const note = await getNoteById(noteId);

  if (!note) {
    const error = new Error('Note not found.');
    error.status = 404;
    throw error;
  }

  if (note.user_id !== userId) {
    const error = new Error('You do not have permission to delete this note.');
    error.status = 403;
    throw error;
  }

  await deleteNote(note);
  return true;
};

// Restore a trashed note
const restoreTrashedNote = async (noteId, userId) => {
  const note = await getTrashedNoteById(noteId);

  if (!note || !note.deleted_at) {
    const error = new Error('Note not found in trash.');
    error.status = 404;
    throw error;
  }

  if (note.user_id !== userId) {
    const error = new Error('You do not have permission to restore this note.');
    error.status = 403;
    throw error;
  }

  await restoreNote(note);
  return true;
};

// Permanently delete a note from the database
const permanentlyDeleteExistingNote = async (noteId, userId) => {
  const note = await getTrashedNoteById(noteId);

  if (!note) {
    const error = new Error('Note not found.');
    error.status = 404;
    throw error;
  }

  if (note.user_id !== userId) {
    const error = new Error('You do not have permission to delete this note.');
    error.status = 403;
    throw error;
  }

  await permanentlyDeleteNote(note);
  return true;
};

module.exports = {
  fetchAllNotes,
  fetchTrashedNotes,
  fetchNoteById,
  searchNotes,
  createNewNote,
  updateExistingNote,
  autosaveNote,
  togglePinNote,
  trashNote,
  restoreTrashedNote,
  permanentlyDeleteExistingNote,
};