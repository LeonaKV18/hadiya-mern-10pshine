const express = require('express');
const router = express.Router();
const passport = require('../config/passportConfig');
const {
  registerUser,
  loginUser,
  verifyUserEmail,
  resendVerificationEmail,
  googleCallback,
} = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

// GET /api/auth/verify-email?token=...
router.get('/verify-email', verifyUserEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', resendVerificationEmail);

// 1: Redirect user to Google's consent screen
router.get(
  '/google',
  passport.authenticate('google', { scope: ['profile', 'email'], session: false })
);

// 2: Google redirects here after user consents
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login', session: false }),
  googleCallback
);

module.exports = router;