const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../../src/models/userModel');

const createTestUser = async ({
  username,
  email,
  password = 'Password1',
  is_verified = true,
  preferences = null,
}) => {
  const hash = await bcrypt.hash(password, 12);

  return User.create({
    username,
    email,
    password_hash: hash,
    is_verified,
    verification_token: is_verified
      ? null
      : 'abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890',
    preferences,
  });
};

const createToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );
};

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

module.exports = {
  createTestUser,
  createToken,
  authHeader,
};