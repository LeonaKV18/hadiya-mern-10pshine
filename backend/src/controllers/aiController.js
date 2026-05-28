const aiService = require('../services/aiService');
const noteService = require('../services/noteService');
const logger = require('../utils/logger');

// POST /api/notes/:id/summarize
const summarizeNote = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    const note = await noteService.fetchNoteById(noteId, req.user.id);

    logger.info({ userId: req.user.id, noteId }, 'AI summarise requested');

    const summary = await aiService.summariseNote(note.title, note.content);

    res.status(200).json({ success: true, summary });
  } catch (error) {
    next(error);
  }
};

module.exports = { summarizeNote };