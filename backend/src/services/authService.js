const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const validator = require('validator');
const { findByEmail, createUser, findByVerificationToken, markAsVerified, updateVerificationToken } = require('../models/userModel');
const { sendVerificationEmail } = require('../utils/emailService');

// Register a new user and send a verification email
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

  // Generate a cryptographically secure random token (64 hex characters)
  const verificationToken = crypto.randomBytes(32).toString('hex');

  const passwordHash = await bcrypt.hash(password, 12);

  // Create the user (inactive until email verificaion)
  await createUser(username, email, passwordHash, verificationToken);

  // Send the verification email
  let emailSent = true;
  try {
    await sendVerificationEmail(email, verificationToken);
  } catch (err) {
    emailSent = false;
  }

  return {
    message: emailSent
      ? 'Registration successful. Please check your email to verify your account before logging in.'
      : 'Verification email could not be sent. Please resend email to try again.',
  };
};

// Log in a verified user
const login = async (email, password) => {
  email = email?.trim().toLowerCase();
  password = password?.trim();

  if (!email || !password) {
    const error = new Error('Email and password are required.');
    error.status = 400;
    throw error;
  }

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

  if (!user.password_hash) {
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

  // Block login until the user verifies their email
  if (!user.is_verified) {
    const error = new Error('Please verify your email address before logging in. Check your inbox.');
    error.status = 403;
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

// Verify a user's email address using the token from the verification link
const verifyEmail = async (token) => {
  if (!token) {
    const error = new Error('Verification token is required.');
    error.status = 400;
    throw error;
  }

  const user = await findByVerificationToken(token);
  if (!user) {
    const error = new Error('Invalid or expired verification token.');
    error.status = 400;
    throw error;
  }

  await markAsVerified(user.id);

  return { message: 'Email verified successfully. You can now log in.' };
};

// Resend verification email for an existing unverified account
const resendVerification = async (email) => {
  email = email?.trim().toLowerCase();

  if (!email || !validator.isEmail(email)) {
    const error = new Error('A valid email address is required.');
    error.status = 400;
    throw error;
  }

  const user = await findByEmail(email);

  if (!user || user.is_verified) {
    return {
      message: 'If an unverified account exists with that email, a new verification email has been sent.',
    };
  }

  // Regenerate the token so old links in previous emails stop working
  const newToken = crypto.randomBytes(32).toString('hex');
  await updateVerificationToken(user.id, newToken);

  try {
    await sendVerificationEmail(email, newToken);
  } catch (err) {
    const error = new Error('Could not send the verification email. Please try again later.');
    error.status = 500;
    throw error;
  }

  return {
    message: 'If unverified account with that email exists, a new verification email has been sent.',
  };
};

module.exports = { register, login, verifyEmail, resendVerification};