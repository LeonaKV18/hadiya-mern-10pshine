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
  is_verified: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
  verification_token: {
    type: DataTypes.STRING(64),
    allowNull: true,
    defaultValue: null,
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
    attributes: { exclude: ['password_hash', 'verification_token'] },
  });
};

// insert a new user with a verification token, marked as unverified
const createUser = async (username, email, passwordHash, verificationToken) => {
  return User.create({
    username,
    email,
    password_hash: passwordHash,
    is_verified: false,
    verification_token: verificationToken,
  });
};

// find a user by their verification token
const findByVerificationToken = async (token) => {
  return User.findOne({ where: { verification_token: token } });
};

// mark a user as verified and clear their token
const markAsVerified = async (userId) => {
  return User.update(
    { is_verified: true, verification_token: null },
    { where: { id: userId } }
  );
};

module.exports = { User, findByEmail, findById, createUser, findByVerificationToken, markAsVerified };