const { findById, updatePreferences, deleteUserById } = require('../models/userModel');
const logger = require('../utils/logger');

// GET /api/users/me
const getMyProfile = async (req, res, next) => {
  try {
    const user = await findById(req.user.id);

    if (!user) {
      const error = new Error('User not found.');
      error.status = 404;
      throw error;
    }

    res.status(200).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/users/preferences
// Body: { theme: "dark" | "light" }
const updateUserPreferences = async (req, res, next) => {
  try {
    const allowed = ['theme'];
    const incoming = req.body;

    // Only accept known preference keys
    const sanitised = {};
    for (const key of allowed) {
      if (incoming[key] !== undefined) {
        sanitised[key] = incoming[key];
      }
    }

    if (Object.keys(sanitised).length === 0) {
      const error = new Error('No valid preference fields provided.');
      error.status = 400;
      throw error;
    }

    if (sanitised.theme && !['light', 'dark'].includes(sanitised.theme)) {
      const error = new Error('theme must be "light" or "dark".');
      error.status = 400;
      throw error;
    }

    // Merge with existing preferences so we don't overwrite unrelated settings
    const existingUser = await findById(req.user.id);
    const existingPrefs = existingUser.preferences || {};
    const merged = { ...existingPrefs, ...sanitised };

    await updatePreferences(req.user.id, merged);

    logger.info({ userId: req.user.id, preferences: merged }, 'User preferences updated');
    res.status(200).json({ success: true, preferences: merged });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/users/me — permanently delete the account and all its data
const deleteMyAccount = async (req, res, next) => {
  try {
    await deleteUserById(req.user.id);
    logger.info({ userId: req.user.id }, 'User account deleted');
    res.status(200).json({ success: true, message: 'Account deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMyProfile, updateUserPreferences, deleteMyAccount };