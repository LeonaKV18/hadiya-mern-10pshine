const authService = require('../services/authService');
const logger = require('../utils/logger');

// Handle POST /api/auth/register
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const user = await authService.register(username, email, password);

    // Log successful registration with user details
    logger.info({ userId: user.id, username: user.username }, 'New user registered');

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user,
    });
  } catch (error) {
    // Log failed registration attempts as warnings
    logger.warn({ email: req.body.email, reason: error.message }, 'Registration failed');
    next(error);
  }
};

// Handle POST /api/auth/login
const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);

    // Log successful login
    logger.info({ userId: result.user.id, username: result.user.username }, 'User logged in');

    res.status(200).json({
      success: true,
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    // Log failed login attempts
    logger.warn({ email: req.body.email, reason: error.message }, 'Login attempt failed');
    next(error);
  }
};

module.exports = { registerUser, loginUser };