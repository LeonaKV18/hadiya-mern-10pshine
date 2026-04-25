const express = require('express');
const router = express.Router();
const { registerUser, loginUser, verifyUserEmail, resendVerificationEmail } = require('../controllers/authController');

// POST /api/auth/register
router.post('/register', registerUser);

// POST /api/auth/login
router.post('/login', loginUser);

// GET /api/auth/verify-email?token=...
router.get('/verify-email', verifyUserEmail);

// POST /api/auth/resend-verification
router.post('/resend-verification', resendVerificationEmail);

module.exports = router;