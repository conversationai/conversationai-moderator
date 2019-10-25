/*
Copyright 2019 Google Inc.

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
/**
 * Core process for starting the server.
 * The server can run in two modes:
 *
 * - STANDALONE: The server will serve both the static files and the API
 *   entrypoints.
 *
 * - SPLIT: The static files are served from a separate server - e.g.,
 *   Webpack or S3.  In this case we just serve the API entrypoints.)
 *
 * It currently does this by looking at the two environment variables:
 *
 * - FRONTEND_URL: The URL used to fetch static files.
 *
 * - API_URL: The root URL of the API.
 *
 * If the latter is a sub-URL of the former, then we assume we are running in
 * STANDALONE mode.
 */

import * as expressWs from 'express-ws';
import { readFileSync } from 'fs';
import * as http from 'http';
import * as https from 'https';

import { mountWebFrontend } from '@conversationai/moderator-frontend-web';

import { mountAPI } from '.';
import { applyCommonPostprocessors, getExpressAppWithPreprocessors } from './api/util/server';
import { config } from './config';
import { logger } from './logger';
import { mountQueueDashboard } from './processing';
import { registerInit, registerServer } from './server-management';

const frontend_url = config.get('frontend_url');
if (!frontend_url) {
  logger.error('FRONTEND_URL is not defined!');
  process.exit(1);
}

const api_url = config.get('api_url');
if (!api_url) {
  logger.error('API_URL is not defined!');
  process.exit(1);
}

const STANDALONE = api_url.startsWith(frontend_url);
const pUrl = new URL(api_url);
const port = pUrl.port || (pUrl.protocol === 'https:' ? 443 : 80);
const path = pUrl.pathname;

async function init() {
  const app = getExpressAppWithPreprocessors(false);
  let server;

  if (pUrl.protocol === 'https:') {
    // We assume a LetsEncrypt generated key
    const sslRoot = `/etc/letsencrypt/live/${pUrl.hostname}`;
    const privateKey = readFileSync(`${sslRoot}/privkey.pem`, 'utf8');
    const certificate = readFileSync(`${sslRoot}/fullchain.pem`, 'utf8');
    const credentials = {key: privateKey, cert: certificate};
    server = https.createServer(credentials, app);
  }
  else {
    server = http.createServer(app);
  }

  expressWs(app, server);

  if (config.get('env') === 'development') {
    console.log('Publishing dev services.');
    app.use('/queues', mountQueueDashboard());
  }

  // TODO: We may need to resurrect these entrypoints for external integration.
  //       Not sure who will use the task API.
  // app.use('/tasks', mountTaskAPI());

  app.use(path, await mountAPI());

  if (STANDALONE) {
    console.log('Mounting web frontend');
    app.use('/', mountWebFrontend());
  }

  applyCommonPostprocessors(app);

  console.log(`Binding to ${pUrl.protocol} ${pUrl.hostname} : ${port}`);
  await server.listen({host: '0.0.0.0', port});
  console.log(`Started server in ${STANDALONE ? 'standalone' : 'API only'} mode`);

  registerServer(server);
}

registerInit(init);
init();
