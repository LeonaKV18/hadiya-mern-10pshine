require('dotenv').config();

const express = require('express');
const cors = require('cors');

const app = express();

// Allow requests from the React frontend
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// Health check route
app.get('/', (req, res) => {
  res.json({ message: 'PlumPad API is running' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Export app for use in tests
module.exports = app;