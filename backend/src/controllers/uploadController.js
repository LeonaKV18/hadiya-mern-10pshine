const uploadService = require('../services/uploadService');
const logger = require('../utils/logger');

// POST /api/notes/:id/attachments
const uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('No file was uploaded.');
      error.status = 400;
      throw error;
    }

    const noteId = req.params.id ? parseInt(req.params.id, 10) : null;
    const attachment = await uploadService.saveAttachment(req.user.id, noteId, req.file);

    logger.info(
      { userId: req.user.id, noteId, attachmentId: attachment.id, filename: req.file.originalname },
      'File uploaded'
    );

    res.status(201).json({ success: true, attachment });
  } catch (error) {
    next(error);
  }
};

// GET /api/notes/:id/attachments
const getAttachments = async (req, res, next) => {
  try {
    const noteId = parseInt(req.params.id, 10);
    const attachments = await uploadService.fetchAttachmentsForNote(noteId, req.user.id);
    res.status(200).json({ success: true, attachments });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/attachments/:attachmentId
const deleteAttachment = async (req, res, next) => {
  try {
    const attachmentId = parseInt(req.params.attachmentId, 10);
    await uploadService.removeAttachment(attachmentId, req.user.id);
    logger.info({ userId: req.user.id, attachmentId }, 'Attachment deleted');
    res.status(200).json({ success: true, message: 'Attachment deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { uploadAttachment, getAttachments, deleteAttachment };