require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');
const pinoHttp = require('pino-http');
const logger = require('./src/utils/logger');
const testConnection = require('./src/config/testConnection');
const sequelize = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');
const noteRoutes = require('./src/routes/noteRoutes');
const folderRoutes = require('./src/routes/folderRoutes');
const uploadRoutes = require('./src/routes/uploadRoutes');
const errorHandler = require('./src/middleware/errorHandler');
const passport = require('./src/config/passportConfig');

// ensure model associations are registered before sync
require('./src/models/noteModel');
require('./src/models/folderModel');
require('./src/models/attachmentModel');

const app = express();

// Allow requests from the React frontend
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Log every HTTP request and response automatically
app.use(pinoHttp({ logger }));

// Serve uploaded files as static content
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/notes', uploadRoutes);
app.use('/api/folders', folderRoutes);

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