require('dotenv').config();

const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');
const logger = require('./src/utils/logger');
const testConnection = require('./src/config/testConnection');
const sequelize = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Allow requests from the React frontend
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Log every HTTP request and response automatically
app.use(pinoHttp({ logger }));

// Routes
app.use('/api/auth', authRoutes);

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'PlumPad API is running' });
});

// Global error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Verify DB connection and sync Sequelize models before starting the server
const startServer = async () => {
  await testConnection();
  await sequelize.sync({ alter: true });
  app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = { app, startServer };