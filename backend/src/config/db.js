const { Sequelize } = require('sequelize');

require('dotenv').config();

// Create a Sequelize instance connected to MySQL
const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    pool: {
      max: 10,
      min: 0,
      acquire: 10000,
      idle: 10000,
    },
    logging: false,
  }
);

module.exports = sequelize;