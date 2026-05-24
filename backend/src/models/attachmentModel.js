const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const { User } = require('./userModel');
const { Note } = require('./noteModel');

const Attachment = sequelize.define('Attachment', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // note_id is nullable — a file can be uploaded before being attached to a note
  note_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  original_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  stored_name: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  mimetype: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  size: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  // relative path from the uploads directory root
  path: {
    type: DataTypes.STRING(500),
    allowNull: false,
  },
}, {
  tableName: 'attachments',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

Attachment.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Attachment, { foreignKey: 'user_id' });

Attachment.belongsTo(Note, { foreignKey: 'note_id', onDelete: 'SET NULL' });
Note.hasMany(Attachment, { foreignKey: 'note_id' });

const getAttachmentsByNote = async (noteId) => {
  return Attachment.findAll({ where: { note_id: noteId } });
};

const getAttachmentById = async (id) => {
  return Attachment.findOne({ where: { id } });
};

const createAttachment = async (data) => {
  return Attachment.create(data);
};

const deleteAttachment = async (attachment) => {
  return attachment.destroy();
};

module.exports = {
  Attachment,
  getAttachmentsByNote,
  getAttachmentById,
  createAttachment,
  deleteAttachment,
};