require('dotenv').config();

let fallbackConfig = {};
try {
  fallbackConfig = require('./config.json');
} catch (e) {}

module.exports = {
  development: {
    username: process.env.DB_USERNAME || fallbackConfig.development?.username || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : fallbackConfig.development?.password,
    database: process.env.DB_NAME || fallbackConfig.development?.database || 'flight_search_db_dev',
    host: process.env.DB_HOST || fallbackConfig.development?.host || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql'
  },
  test: {
    username: process.env.DB_USERNAME || fallbackConfig.test?.username || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : fallbackConfig.test?.password,
    database: process.env.DB_NAME || fallbackConfig.test?.database || 'Flight_Search_DB_TEST',
    host: process.env.DB_HOST || fallbackConfig.test?.host || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql'
  },
  production: {
    username: process.env.DB_USERNAME || fallbackConfig.production?.username || 'root',
    password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : fallbackConfig.production?.password,
    database: process.env.DB_NAME || fallbackConfig.production?.database || 'Flight_Search_DB_PROD',
    host: process.env.DB_HOST || fallbackConfig.production?.host || '127.0.0.1',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql'
  }
};
