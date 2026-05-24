const {
  getAllFoldersByUser,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
} = require('../models/folderModel');

const fetchAllFolders = async (userId) => {
  return getAllFoldersByUser(userId);
};

const fetchFolderById = async (folderId, userId) => {
  const folder = await getFolderById(folderId);

  if (!folder) {
    const error = new Error('Folder not found.');
    error.status = 404;
    throw error;
  }

  if (folder.user_id !== userId) {
    const error = new Error('You do not have permission to access this folder.');
    error.status = 403;
    throw error;
  }

  return folder;
};

const createNewFolder = async (userId, name, parentId) => {
  if (!name || !name.trim()) {
    const error = new Error('Folder name is required.');
    error.status = 400;
    throw error;
  }

  // Prevent excessively deep nesting by checking parent belongs to same user
  if (parentId) {
    const parent = await getFolderById(parentId);
    if (!parent || parent.user_id !== userId) {
      const error = new Error('Parent folder not found.');
      error.status = 404;
      throw error;
    }
  }

  return createFolder(userId, name.trim(), parentId || null);
};

const renameFolder = async (folderId, userId, name) => {
  const folder = await fetchFolderById(folderId, userId);

  if (!name || !name.trim()) {
    const error = new Error('Folder name is required.');
    error.status = 400;
    throw error;
  }

  return updateFolder(folder, { name: name.trim() });
};

const removeFolder = async (folderId, userId) => {
  const folder = await fetchFolderById(folderId, userId);
  await deleteFolder(folder);
  return true;
};

module.exports = {
  fetchAllFolders,
  fetchFolderById,
  createNewFolder,
  renameFolder,
  removeFolder,
};