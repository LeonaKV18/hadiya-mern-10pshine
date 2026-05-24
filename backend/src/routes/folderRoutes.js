const express = require('express');
const router = express.Router();
const {
  getAllFolders,
  getFolderById,
  createFolder,
  renameFolder,
  deleteFolder,
} = require('../controllers/folderController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/', getAllFolders);
router.post('/', createFolder);
router.get('/:id', getFolderById);
router.put('/:id', renameFolder);
router.delete('/:id', deleteFolder);

module.exports = router;