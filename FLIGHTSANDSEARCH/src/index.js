const express = require('express');
const bodyParser = require('body-parser');
require('./config/serverConfig');
const {City} = require('./models/index');
const serverConfig = require('./config/serverConfig');
const apiRoutes = require('./routes/index');

const cityRepository = require('./repository/city-repo'); 
const setupAndStartServer = async () => {
  const app = express();


  // middleware to parse JSON and URL-encoded data
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));

  app.use('/api', apiRoutes);
  app.get('/api/v1/health', (req, res) => res.status(200).json({ status: 'ok' }));

  const port = serverConfig.PORT;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
setupAndStartServer();