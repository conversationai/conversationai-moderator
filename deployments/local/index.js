/*
Copyright 2017 Google Inc.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

// Activate Google Cloud Trace and Debug when in production
if (process.env.NODE_ENV === 'production') {
  require('@google/cloud-trace').start();
  require('@google/cloud-debug');
}

const { makeServer } = require('@conversationai/moderator-backend-core');
const { mountWebFrontend } = require('@conversationai/moderator-frontend-web');
const { mountAPI } = require('@conversationai/moderator-backend-api');
const { mountQueueDashboard, startProcessing } = require('@conversationai/moderator-backend-queue');

/**
 * Queue setup.
 */

// Start the queue worker
startProcessing();

/**
 * HTTP setup
 */

const {
  app,
  start,
} = makeServer();

// Required for GAE
app.disable('etag');
app.set('trust proxy', true);

// Start the Web frontend
app.use('/', mountWebFrontend());

// Start up the api
app.use('/api', mountAPI());

// Start up queue dashboard
app.use('/queue', mountQueueDashboard());


start(8080);
