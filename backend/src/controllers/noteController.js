const noteService = require('../services/noteService');
const logger = require('../utils/logger');

// Handle GET /api/notes
const getAllNotes = async (req, res, next) => {
  try {
    const notes = await noteService.fetchAllNotes(req.user.id);
    res.status(200).json({ success: true, notes });
  } catch (error) {
    next(error);
  }
};

// Handle GET /api/notes/:id
const getNoteById = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    const note = await noteService.fetchNoteById(noteId, req.user.id);
    res.status(200).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// Handle POST /api/notes
const createNote = async (req, res, next) => {
  try {
    const { title, content } = req.body;
    const note = await noteService.createNewNote(req.user.id, title, content);
    logger.info({ userId: req.user.id, noteId: note.id }, 'Note created');
    res.status(201).json({ success: true, note });
  } catch (error) {
    next(error);
  }
};

// Handle PUT /api/notes/:id
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

// Handle DELETE /api/notes/:id
const deleteNote = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    await noteService.deleteExistingNote(noteId, req.user.id);
    logger.info({ userId: req.user.id, noteId }, 'Note deleted');
    res.status(200).json({ success: true, message: 'Note deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllNotes, getNoteById, createNote, updateNote, deleteNote };