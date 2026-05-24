const noteService = require('../services/noteService');
const logger = require('../utils/logger');

// GET /api/notes
const getAllNotes = async (req, res, next) => {
  try {
    const notes = await noteService.fetchAllNotes(req.user.id);
    res.status(200).json({ success: true, notes });
  } catch (error) {
    next(error);
  }
};

// GET /api/notes/trash
const getTrashedNotes = async (req, res, next) => {
  try {
    const notes = await noteService.fetchTrashedNotes(req.user.id);
    res.status(200).json({ success: true, notes });
  } catch (error) {
    next(error);
  }
};

// GET /api/notes/search?q=...
const searchNotes = async (req, res, next) => {
  try {
    const notes = await noteService.searchNotes(req.user.id, req.query.q);
    res.status(200).json({ success: true, notes });
  } catch (error) {
    next(error);
  }
};

// GET /api/notes/:id
const getNoteById = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    const note = await noteService.fetchNoteById(noteId, req.user.id);
    res.status(200).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// POST /api/notes
const createNote = async (req, res, next) => {
  try {
    const { title, content, folder_id } = req.body;
    const note = await noteService.createNewNote(req.user.id, title, content, folder_id);
    logger.info({ userId: req.user.id, noteId: note.id }, 'Note created');
    res.status(201).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// PUT /api/notes/:id
const updateNote = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    const { title, content } = req.body;
    const note = await noteService.updateExistingNote(noteId, req.user.id, title, content);
    logger.info({ userId: req.user.id, noteId }, 'Note updated');
    res.status(200).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/notes/:id/autosave
const autosaveNote = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    const { content } = req.body;
    const note = await noteService.autosaveNote(noteId, req.user.id, content);
    res.status(200).json({ success: true, saved_at: note.updated_at });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notes/:id  (soft delete - move to trash)
const deleteNote = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    await noteService.trashNote(noteId, req.user.id);
    logger.info({ userId: req.user.id, noteId }, 'Note moved to trash');
    res.status(200).json({ success: true, message: 'Note moved to trash.' });
  } catch (error) {
    next(error);
  }
};

// POST /api/notes/:id/restore
const restoreNote = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    await noteService.restoreTrashedNote(noteId, req.user.id);
    logger.info({ userId: req.user.id, noteId }, 'Note restored from trash');
    res.status(200).json({ success: true, message: 'Note restored successfully.' });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/notes/:id/permanent
const permanentlyDeleteNote = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    await noteService.permanentlyDeleteExistingNote(noteId, req.user.id);
    logger.info({ userId: req.user.id, noteId }, 'Note permanently deleted');
    res.status(200).json({ success: true, message: 'Note permanently deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllNotes,
  getTrashedNotes,
  searchNotes,
  getNoteById,
  createNote,
  updateNote,
  autosaveNote,
  deleteNote,
  restoreNote,
  permanentlyDeleteNote,
};