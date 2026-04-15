const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const validator = require('validator');
const { findByEmail, createUser } = require('../models/userModel');

// Register new user
const register = async (username, email, password) => {
  // Trim inputs before validation
  username = username?.trim();
  email = email?.trim().toLowerCase();
  password = password?.trim();

  // Presence check
  if (!username || !email || !password) {
    const error = new Error('Username, email, and password are all required.');
    error.status = 400;
    throw error;
  }

  // Username: 3–20 chars, letters/numbers/underscores only, no spaces
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
  if (!usernameRegex.test(username)) {
    const error = new Error(
      'Username must be 3–20 characters and can only contain letters, numbers, and underscores.'
    );
    error.status = 400;
    throw error;
  }

  // Email: check using validator.js
  if (!validator.isEmail(email)) {
    const error = new Error('Please provide a valid email address.');
    error.status = 400;
    throw error;
  }

  // Password: min 8 chars, at least one uppercase, one lowercase, one number
  if (password.length < 8) {
    const error = new Error('Password must be at least 8 characters long.');
    error.status = 400;
    throw error;
  }
  if (!/[A-Z]/.test(password)) {
    const error = new Error('Password must contain at least one uppercase letter.');
    error.status = 400;
    throw error;
  }
  if (!/[a-z]/.test(password)) {
    const error = new Error('Password must contain at least one lowercase letter.');
    error.status = 400;
    throw error;
  }
  if (!/[0-9]/.test(password)) {
    const error = new Error('Password must contain at least one number.');
    error.status = 400;
    throw error;
  }

  // Duplicate email check
  const existingUser = await findByEmail(email);
  if (existingUser) {
    const error = new Error('An account with this email already exists.');
    error.status = 409;
    throw error;
  }

  const passwordHash = await bcrypt.hash(password, 12); 
  const user = await createUser(username, email, passwordHash);
  return { id: user.id, username: user.username, email: user.email };
};

// Log in an existing user
const login = async (email, password) => {
  email = email?.trim().toLowerCase();
  password = password?.trim();

  if (!email || !password) {
    const error = new Error('Email and password are required.');
    error.status = 400;
    throw error;
  }

  // Basic format check before hitting the DB
  if (!validator.isEmail(email)) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  const user = await findByEmail(email);
  if (!user) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    const error = new Error('Invalid email or password.');
    error.status = 401;
    throw error;
  }

  const token = jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return {
    token,
    user: { id: user.id, username: user.username, email: user.email },
  };
};

module.exports = { register, login };