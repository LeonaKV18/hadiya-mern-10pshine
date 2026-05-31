const express = require('express');
const router = express.Router();
const { getMyProfile, updateUserPreferences, deleteMyAccount } = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

router.use(authenticate);

router.get('/me', getMyProfile);
router.patch('/preferences', updateUserPreferences);
router.delete('/me', deleteMyAccount);

module.exports = router;