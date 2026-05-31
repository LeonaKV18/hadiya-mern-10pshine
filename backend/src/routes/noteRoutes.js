const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/noteController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

// Static paths first — must come before /:id
router.get('/trash', getTrashedNotes);
router.get('/search', searchNotes);

// CRUD
router.get('/', getAllNotes);
router.post('/', createNote);
router.get('/:id', getNoteById);
router.put('/:id', updateNote);
router.patch('/:id/autosave', autosaveNote);
router.delete('/:id', deleteNote);
router.post('/:id/restore', restoreNote);
router.delete('/:id/permanent', permanentlyDeleteNote);

module.exports = router;