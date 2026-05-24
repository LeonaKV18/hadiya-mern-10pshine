const folderService = require('../services/folderService');
const logger = require('../utils/logger');

// GET /api/folders
const getAllFolders = async (req, res, next) => {
  try {
    const folders = await folderService.fetchAllFolders(req.user.id);
    res.status(200).json({ success: true, folders });
  } catch (error) {
    next(error);
  }
};

// GET /api/folders/:id
const getFolderById = async (req, res, next) => {
  try {
    const folderId = parseInt(req.params.id, 10);
    const folder = await folderService.fetchFolderById(folderId, req.user.id);
    res.status(200).json({ success: true, folder });
  } catch (error) {
    next(error);
  }
};

// POST /api/folders
const createFolder = async (req, res, next) => {
  try {
    const { name, parent_id } = req.body;
    const folder = await folderService.createNewFolder(req.user.id, name, parent_id);
    logger.info({ userId: req.user.id, folderId: folder.id }, 'Folder created');
    res.status(201).json({ success: true, folder });
  } catch (error) {
    next(error);
  }
};

// PUT /api/folders/:id
const renameFolder = async (req, res, next) => {
  try {
    const folderId = parseInt(req.params.id, 10);
    const { name } = req.body;
    const folder = await folderService.renameFolder(folderId, req.user.id, name);
    logger.info({ userId: req.user.id, folderId }, 'Folder renamed');
    res.status(200).json({ success: true, folder });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/folders/:id
const deleteFolder = async (req, res, next) => {
  try {
    const folderId = parseInt(req.params.id, 10);
    await folderService.removeFolder(folderId, req.user.id);
    logger.info({ userId: req.user.id, folderId }, 'Folder deleted');
    res.status(200).json({ success: true, message: 'Folder deleted. Notes moved to root.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getAllFolders, getFolderById, createFolder, renameFolder, deleteFolder };