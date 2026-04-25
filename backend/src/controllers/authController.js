const authService = require('../services/authService');
const logger = require('../utils/logger');

// Handle POST /api/auth/register
const registerUser = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    const result = await authService.register(username, email, password);

    logger.info({ email: req.body.email }, 'New user registration initiated — verification email sent');

    res.status(201).json({
      success: true,
      message: result.message,
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

// Handle GET /api/auth/verify-email?token=...
const verifyUserEmail = async (req, res, next) => {
  try {
    const { token } = req.query;
    const result = await authService.verifyEmail(token);

    logger.info({ token: token?.slice(0, 8) + '...' }, 'Email verified successfully');

    res.status(200).json({
      success: true,
      message: result.message,
    });
  } catch (error) {
    logger.warn({ reason: error.message }, 'Email verification failed');
    next(error);
  }
};

// Handle POST /api/auth/resend-verification
const resendVerificationEmail = async (req, res, next) => {
  try {
    const { email } = req.body;
    const result = await authService.resendVerification(email);

    logger.info({ email: req.body.email }, 'Verification email resend requested');

    res.status(200).json({ success: true, message: result.message });
  } catch (error) {
    logger.warn({ email: req.body.email, reason: error.message }, 'Verification resend failed');
    next(error);
  }
};

module.exports = { registerUser, loginUser, verifyUserEmail, resendVerificationEmail };