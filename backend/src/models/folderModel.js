const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { User } = require('./userModel');

const Folder = sequelize.define('Folder', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
// parent_id is null for root-level folders and set to another folder id for nesting
  parent_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  // Optional pastel color tag shown on the folder's left edge in the sidebar
  color: {
    type: DataTypes.STRING(20),
    allowNull: true,
    defaultValue: null,
  },
  // System folders (Favorites/Journal/Study/Work) cannot be renamed or deleted
  is_system: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
}, {
  tableName: 'folders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

Folder.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Folder, { foreignKey: 'user_id' });

// Self-referencing association for nested folders
Folder.hasMany(Folder, { as: 'children', foreignKey: 'parent_id' });
Folder.belongsTo(Folder, { as: 'parent', foreignKey: 'parent_id' });

const getAllFoldersByUser = async (userId) => {
  return Folder.findAll({
    where: { user_id: userId },
    order: [['name', 'ASC']],
  });
};

const getFolderById = async (id) => {
  return Folder.findOne({ where: { id } });
};

const createFolder = async (userId, name, parentId = null, color = null) => {
  return Folder.create({ user_id: userId, name, parent_id: parentId, color });
};

const updateFolder = async (folder, fields) => {
  return folder.update(fields);
};

const deleteFolder = async (folder) => {
  return folder.destroy();
};

module.exports = {
  Folder,
  getAllFoldersByUser,
  getFolderById,
  createFolder,
  updateFolder,
  deleteFolder,
};