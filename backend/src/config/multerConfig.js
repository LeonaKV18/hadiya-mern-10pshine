const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const UPLOAD_DIR = path.join(__dirname, '../../uploads');

const MAX_FILE_SIZE = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10) * 1024 * 1024;

// Allowed MIME types by category
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/webm', 'audio/mp4'],
};

const ALL_ALLOWED = Object.values(ALLOWED_TYPES).flat();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate a unique filename using a random hex string + original extension
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${crypto.randomBytes(16).toString('hex')}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (req, file, cb) => {
  if (ALL_ALLOWED.includes(file.mimetype)) {
    cb(null, true);
  } else {
    const error = new Error(
      'Unsupported file type. Allowed: JPEG, PNG, GIF, WebP, PDF, MP3, WAV, OGG, WebM audio.'
    );
    error.status = 400;
    cb(error, false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter,
});

module.exports = { upload, UPLOAD_DIR };