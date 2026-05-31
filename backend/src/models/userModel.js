const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

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
  // Nullable because users who sign in with Google do not have a password
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
  },
  // Google OAuth user ID — null for email/password users
  google_id: {
    type: DataTypes.STRING(255),
    allowNull: true,
    defaultValue: null,
    unique: true,
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
  // JSON column for storing user preferences such as theme
  preferences: {
    type: DataTypes.JSON,
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

// Find or create a user from a Google OAuth profile
const findOrCreateGoogleUser = async (googleId, email, displayName) => {
  // Check if a user already linked this Google account
  let user = await User.findOne({ where: { google_id: googleId } });
  if (user) return { user, created: false };

  // Check if a user already has this email (they registered normally before)
  user = await User.findOne({ where: { email } });
  if (user) {
    // Link the Google account to the existing user
    await user.update({ google_id: googleId, is_verified: true });
    return { user, created: false };
  }

  // Generate a unique username from the display name
  const baseUsername = displayName.replace(/\s+/g, '').toLowerCase().slice(0, 15);
  let username = baseUsername;
  let counter = 1;
  while (await User.findOne({ where: { username } })) {
    username = `${baseUsername}${counter}`;
    counter++;
  }

  // Create a brand new Google user - no password, pre-verified
  user = await User.create({
    username,
    email,
    password_hash: null,
    google_id: googleId,
    is_verified: true,
    verification_token: null,
  });

  return { user, created: true };
};

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

// replace a user's verification token with a newly generated one
const updateVerificationToken = async (userId, newToken) => {
  return User.update(
    { verification_token: newToken },
    { where: { id: userId } }
  );
};

const updatePreferences = async (userId, preferences) => {
  return User.update({ preferences }, { where: { id: userId } });
};

module.exports = {
  User,
  findByEmail,
  findById,
  createUser,
  findOrCreateGoogleUser,
  findByVerificationToken,
  markAsVerified,
  updateVerificationToken,
  updatePreferences,
};