const logger = require('../utils/logger');

// Global error handler
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;

  // Use error level for server faults, warn level for client mistakes
  if (status >= 500) {
    logger.error(
      { err: err.message, stack: err.stack, url: req.url, method: req.method },
      'Internal server error'
    );
  } else {
    logger.warn(
      { err: err.message, url: req.url, method: req.method },
      'Request error'
    );
  }

  res.status(status).json({
    success: false,
    message: err.message || 'An internal server error occurred.',
  });
};

module.exports = errorHandler;
