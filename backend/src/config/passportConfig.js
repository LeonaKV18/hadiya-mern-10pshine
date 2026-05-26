const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const { findOrCreateGoogleUser } = require('../models/userModel');
const logger = require('../utils/logger');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value;

        if (!email) {
          return done(new Error('Google account has no email address.'), null);
        }

        const { user, created } = await findOrCreateGoogleUser(
          profile.id,
          email,
          profile.displayName || email
        );

        logger.info({ userId: user.id, created }, 'Google OAuth login');
        return done(null, user);
      } catch (err) {
        logger.error({ err: err.message }, 'Google OAuth error');
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser((id, done) => done(null, { id }));

module.exports = passport;