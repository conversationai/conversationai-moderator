const { makeServer } = require('@conversationai/moderator-backend-core');
const { mountWebFrontend } = require('@conversationai/moderator-frontend-web');
const { mountAPI } = require('@conversationai/moderator-backend-api');

const {
  app,
  start,
} = makeServer();

app.use('/', mountWebFrontend());
app.use('/api', mountAPI());

start(8080);
