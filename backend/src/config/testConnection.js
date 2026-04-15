const sequelize = require('./db');
const logger = require('../utils/logger');

// Test database connection on startup using Sequelize's built-in authenticate method
const testConnection = async () => {
  try {
    await sequelize.authenticate();
    logger.info('Database connection established successfully.');
  } catch (error) {
    logger.error({ error: error.message }, 'Failed to connect to the database. Check your .env credentials.');
    process.exit(1);
  }
};

module.exports = testConnection;