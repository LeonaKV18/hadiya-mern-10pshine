const {
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
  Folder,
} = require('../models/folderModel');

// System folders are created automatically for every user and cannot be renamed or deleted. 
const SYSTEM_FOLDERS = [
  { name: 'Favorites', color: '#d8bc70' },
  { name: 'Journal', color: '#c790b3' },
  { name: 'Study', color: '#8dbe95' },
  { name: 'Work', color: '#ab94ba' },
];

// Idempotently make sure all system folders exist for a user
const ensureSystemFolders = async (userId) => {
  for (const sys of SYSTEM_FOLDERS) {
    const existing = await Folder.findOne({
      where: { user_id: userId, name: sys.name, is_system: true },
    });
    if (!existing) {
      await Folder.create({
        user_id: userId,
        name: sys.name,
        parent_id: null,
        color: sys.color,
        is_system: true,
      });
    }
  }
};

const fetchAllFolders = async (userId) => {
  await ensureSystemFolders(userId);
  return Folder.findAll({
    where: { user_id: userId },
    order: [
      ['is_system', 'DESC'],
      ['name', 'ASC'],
    ],
  });
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

const createNewFolder = async (userId, name, parentId, color) => {
  const trimmedName = name?.trim();

  if (!trimmedName) {
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

  return createFolder(userId, trimmedName, parentId || null, color || null);
};

// Update a folder's name and/or color. System folders cannot be renamed.
const renameFolder = async (folderId, userId, name, color) => {
  const folder = await fetchFolderById(folderId, userId);
  const fields = {};
  const trimmedName = name?.trim();

  if (trimmedName) {
    if (folder.is_system && trimmedName !== folder.name) {
      const error = new Error('System folders cannot be renamed.');
      error.status = 400;
      throw error;
    }

    fields.name = trimmedName;
  }

  if (color !== undefined) {
    fields.color = color;
  }

  if (Object.keys(fields).length === 0) {
    const error = new Error('Provide a name or color for updates.');
    error.status = 400;
    throw error;
  }

  return updateFolder(folder, fields);
};

const removeFolder = async (folderId, userId) => {
  const folder = await fetchFolderById(folderId, userId);

  if (folder.is_system) {
    const error = new Error('System folders cannot be deleted.');
    error.status = 400;
    throw error;
  }

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