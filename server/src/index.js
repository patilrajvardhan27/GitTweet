'use strict';

const config = require('./config');
const createApp = require('./app');

const app = createApp();

app.listen(config.port, () => {
  console.log(`GitTweet server running on port ${config.port} [${config.isProd ? 'production' : 'development'}]`);
});
