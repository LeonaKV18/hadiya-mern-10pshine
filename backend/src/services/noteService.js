const { getAllNotesByUser, getNoteById, createNote, updateNote, deleteNote } = require('../models/noteModel');

// Fetch all notes for a given user
const fetchAllNotes = async (userId) => {
  return getAllNotesByUser(userId);
};

// Fetch a single note, verify it exists and belongs to the requesting user
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

// Create a new note for a user
const createNewNote = async (userId, title, content) => {
  if (!title || !title.trim()) {
    const error = new Error('Title is required.');
    error.status = 400;
    throw error;
  }

  return createNote(userId, title.trim(), content);
};

// Update an existing note's title and/or content
const updateExistingNote = async (noteId, userId, title, content) => {
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

  if (title === undefined && content === undefined) {
    const error = new Error('Provide at least a title or content to update.');
    error.status = 400;
    throw error;
  }

  const fields = {};
  if (title !== undefined) fields.title = title.trim();
  if (content !== undefined) fields.content = content;

  return updateNote(note, fields);
};

// Delete a note after verifying ownership
const deleteExistingNote = async (noteId, userId) => {
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

module.exports = { fetchAllNotes, fetchNoteById, createNewNote, updateExistingNote, deleteExistingNote };