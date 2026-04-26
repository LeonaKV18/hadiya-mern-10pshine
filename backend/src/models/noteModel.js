const { DataTypes } = require('sequelize');
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
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'notes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
});

// A note belongs to one user (fk relationship) 
Note.belongsTo(User, { foreignKey: 'user_id', onDelete: 'CASCADE' });
User.hasMany(Note, { foreignKey: 'user_id' });

// fetch all notes belonging to a user (newest first)
const getAllNotesByUser = async (userId) => {
  return Note.findAll({
    where: { user_id: userId },
    order: [['updated_at', 'DESC']],
  });
};

// find a single note by its primary key
const getNoteById = async (id) => {
  return Note.findOne({ where: { id } });
};

// insert a new note linked to a user
const createNote = async (userId, title, content) => {
  return Note.create({ user_id: userId, title, content: content || '' });
};

// update a note's fields in the database
const updateNote = async (note, fields) => {
  return note.update(fields);
};

// delete a note from the database
const deleteNote = async (note) => {
  return note.destroy();
};

module.exports = { Note, getAllNotesByUser, getNoteById, createNote, updateNote, deleteNote };