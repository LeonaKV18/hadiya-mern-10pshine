const path = require('path');
const fs = require('fs');
const {
  getAttachmentsByNote,
  getAttachmentById,
  createAttachment,
  deleteAttachment,
} = require('../models/attachmentModel');
const { getNoteById } = require('../models/noteModel');
const { UPLOAD_DIR } = require('../config/multerConfig');

// Save file metadata to the database after multer has stored the file on disk
const saveAttachment = async (userId, noteId, file) => {
  // If a noteId was provided, verify the note exists and belongs to the user
  if (noteId) {
    const note = await getNoteById(parseInt(noteId, 10));
    if (!note) {
      const error = new Error('Note not found.');
      error.status = 404;
      throw error;
    }
    if (note.user_id !== userId) {
      const error = new Error('You do not have permission to attach files to this note.');
      error.status = 403;
      throw error;
    }
  }

  return createAttachment({
    user_id: userId,
    note_id: noteId || null,
    original_name: file.originalname,
    stored_name: file.filename,
    mimetype: file.mimetype,
    size: file.size,
    path: file.path,
  });
};

// Fetch all attachments belonging to a note (verifying user owns the note)
const fetchAttachmentsForNote = async (noteId, userId) => {
  const note = await getNoteById(noteId);

  if (!note) {
    const error = new Error('Note not found.');
    error.status = 404;
    throw error;
  }

  if (note.user_id !== userId) {
    const error = new Error('You do not have permission to view this note.');
    error.status = 403;
    throw error;
  }

  return getAttachmentsByNote(noteId);
};

// Delete an attachment record and remove the file from disk
const removeAttachment = async (attachmentId, userId) => {
  const attachment = await getAttachmentById(attachmentId);

  if (!attachment) {
    const error = new Error('Attachment not found.');
    error.status = 404;
    throw error;
  }

  if (attachment.user_id !== userId) {
    const error = new Error('You do not have permission to delete this attachment.');
    error.status = 403;
    throw error;
  }

  // Remove the physical file from disk
  const filePath = attachment.path;
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await deleteAttachment(attachment);
  return true;
};

module.exports = { saveAttachment, fetchAttachmentsForNote, removeAttachment };