const express = require('express');
const router = express.Router({ mergeParams: true });
const { uploadAttachment, getAttachments, deleteAttachment } = require('../controllers/uploadController');
const { authenticate } = require('../middleware/authMiddleware');
const { upload } = require('../config/multerConfig');

router.use(authenticate);

// Upload a file and attach it to a note
router.post('/:id/attachments', upload.single('file'), uploadAttachment);

// Get all attachments for a note
router.get('/:id/attachments', getAttachments);

// Delete an attachment by its own ID
router.delete('/attachments/:attachmentId', deleteAttachment);

module.exports = router;