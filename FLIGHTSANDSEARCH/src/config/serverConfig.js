const dotenv = require('dotenv');

const result = dotenv.config();
console.log("PORT =", process.env.PORT);

module.exports = {
  PORT: process.env.PORT
};