const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

// Define the User model — Sequelize maps this to the 'users' table
const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
}, {
  tableName: 'users',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

// find a user by their email address
const findByEmail = async (email) => {
  return User.findOne({ where: { email } });
};

// find a user by their ID, excluding the password hash
const findById = async (id) => {
  return User.findOne({
    where: { id },
    attributes: { exclude: ['password_hash'] },
  });
};

// insert a new user into the database
const createUser = async (username, email, passwordHash) => {
  return User.create({ username, email, password_hash: passwordHash });
};

module.exports = { User, findByEmail, findById, createUser };