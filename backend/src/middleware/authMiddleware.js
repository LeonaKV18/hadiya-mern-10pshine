const jwt = require('jsonwebtoken');

// Verify JWT token and attach user data to the request
const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  // Check whether Authorization header exists and starts with "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Access denied. No token provided.');
    error.status = 401;
    return next(error);
  }

  // Extract the token from "Bearer <token>"
  const token = authHeader.split(' ')[1];

  try {
    // Verify the token signature and expiry using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach the decoded user info to req.user for use in controllers
    req.user = { id: decoded.id, username: decoded.username };

    next();
  } catch (err) {
    const error = new Error('Invalid or expired token. Please log in again.');
    error.status = 401;
    next(error);
  }
};

module.exports = { authenticate };