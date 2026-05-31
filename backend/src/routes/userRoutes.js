const express = require('express');
const router = express.Router();
const { getMyProfile, updateUserPreferences } = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/me', getMyProfile);
router.patch('/preferences', updateUserPreferences);

module.exports = router;