const { DB_NAME, DB_USERNAME, DB_PASSWORD, DB_HOST } = require('./serverConfig');

module.exports = {
  development: {
    username: DB_USERNAME,
    password: DB_PASSWORD,
    database: DB_NAME,
    host: DB_HOST,
    dialect: 'mysql'
  }
};
