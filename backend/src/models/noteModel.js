const { DataTypes, Op } = require('sequelize');
const sequelize = require('../config/db');
const { User } = require('./userModel');

const Note = sequelize.define('Note', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  folder_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: null,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  },
}, {
  tableName: 'notes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  // paranoid adds deleted_at; records are hidden rather than removed on destroy()
  paranoid: true,
  deletedAt: 'deleted_at',
});

// A note belongs to one user (fk relationship) 
Note.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Note, { foreignKey: 'user_id' });

// Fetch all active (non-deleted) notes for a user, newest first
const getAllNotesByUser = async (userId) => {
  return Note.findAll({
    where: { user_id: userId },
    order: [['updated_at', 'DESC']],
  });
};

// Fetch all soft-deleted notes for a user
const getTrashedNotesByUser = async (userId) => {
  return Note.findAll({
    where: {
      user_id: userId,
      deleted_at: { [Op.not]: null },
    },
    paranoid: false,
    order: [['deleted_at', 'DESC']],
  });
};

// Find a single active note by primary key
const getNoteById = async (id) => {
  return Note.findOne({ where: { id } });
};

// Find a trashed note by primary key (must use paranoid: false to see it)
const getTrashedNoteById = async (id) => {
  return Note.findOne({ where: { id }, paranoid: false });
};

// Search active notes by title or content
const searchNotesByUser = async (userId, query) => {
  return Note.findAll({
    where: {
      user_id: userId,
      [Op.or]: [
        { title: { [Op.like]: `%${query}%` } },
        { content: { [Op.like]: `%${query}%` } },
      ],
    },
    order: [['updated_at', 'DESC']],
  });
};

// Insert a new note for a user
const createNote = async (userId, title, content, folderId = null) => {
  return Note.create({
    user_id: userId,
    title,
    content: content || '',
    folder_id: folderId,
  });
};

// Update a note's fields
const updateNote = async (note, fields) => {
  return note.update(fields);
};

// Soft delete — sets deleted_at, hides from normal queries
const deleteNote = async (note) => {
  return note.destroy();
};

// Restore a soft-deleted note
const restoreNote = async (note) => {
  return note.restore();
};

// Permanently remove a note from the database
const permanentlyDeleteNote = async (note) => {
  return note.destroy({ force: true });
};

module.exports = {
  Note,
  getAllNotesByUser,
  getTrashedNotesByUser,
  getNoteById,
  getTrashedNoteById,
  searchNotesByUser,
  createNote,
  updateNote,
  deleteNote,
  restoreNote,
  permanentlyDeleteNote,
};