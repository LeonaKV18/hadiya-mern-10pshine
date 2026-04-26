const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/authMiddleware');
const { getAllNotes, getNoteById, createNote, updateNote, deleteNote } = require('../controllers/noteController');

router.use(authenticate);

// GET /api/notes
router.get('/', getAllNotes);

// GET /api/notes/:id
router.get('/:id', getNoteById);

// POST /api/notes
router.post('/', createNote);

// PUT /api/notes/:id
router.put('/:id', updateNote);

// DELETE /api/notes/:id
router.delete('/:id', deleteNote);

module.exports = router;