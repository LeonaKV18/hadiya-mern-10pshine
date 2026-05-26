const exportService = require('../services/exportService');
const noteService = require('../services/noteService');
const logger = require('../utils/logger');

// GET /api/notes/:id/export?format=pdf|docx
const exportNote = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    const format = (req.query.format || 'pdf').toLowerCase();

    if (!['pdf', 'docx'].includes(format)) {
      const error = new Error('Format must be either "pdf" or "docx".');
      error.status = 400;
      throw error;
    }

    const note = await noteService.fetchNoteById(noteId, req.user.id);

    logger.info({ userId: req.user.id, noteId, format }, 'Note export requested');

    if (format === 'pdf') {
      const pdfBuffer = await exportService.generatePdf(note.title, note.content);
      res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(note.title)}.pdf"`,
        'Content-Length': pdfBuffer.length,
      });
      return res.end(pdfBuffer);
    }

    if (format === 'docx') {
      const docxBuffer = await exportService.generateDocx(note.title, note.content);
      res.set({
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(note.title)}.docx"`,
        'Content-Length': docxBuffer.length,
      });
      return res.end(docxBuffer);
    }
  } catch (error) {
    next(error);
  }
};

module.exports = { exportNote };