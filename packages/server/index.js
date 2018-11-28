const { makeServer } = require('@conversationai/moderator-backend-core');
const { mountWebFrontend } = require('@conversationai/moderator-frontend-web');
const { mountAPI } = require('@conversationai/moderator-backend-api');

async function init() {
  const {
    app,
    start,
  } = makeServer();

  app.use('/', mountWebFrontend());
  app.use('/api', await mountAPI());

  start(8080);
}

init();
