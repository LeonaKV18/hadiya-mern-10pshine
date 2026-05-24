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

const createFolder = async (userId, name, parentId = null) => {
  return Folder.create({ user_id: userId, name, parent_id: parentId });
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