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


const url = process.argv.length >= 3 ? process.argv[2] : "http://localhost:8080";

process.env.FRONTEND_URL = url;
process.env.API_URL = `${url}/api`;

const pUrl = new URL(url);
const port = pUrl.port || (pUrl.protocol === 'https' ? 443 : 80);

const expressWs = require('express-ws');
const fs = require('fs');
const https = require('https');
const http = require('http');

const { makeAppPart1, makeAppPart2 } = require('@conversationai/moderator-backend-core');
const { mountWebFrontend } = require('@conversationai/moderator-frontend-web');
const { mountAPI } = require('@conversationai/moderator-backend-api');

async function init() {
  const app = makeAppPart1(false);
  let server;

  if (pUrl.protocol === 'https:') {
    const privateKey = fs.readFileSync('sslcert/key.pem', 'utf8');
    const certificate = fs.readFileSync('sslcert/cert.pem', 'utf8');
    const credentials = {key: privateKey, cert: certificate};
    server = https.createServer(credentials, app);
  }
  else {
    server = http.createServer(app);
  }

  expressWs(app, server);

  app.use('/api', await mountAPI());
  app.use('/', mountWebFrontend());

  makeAppPart2(app);

  console.log(`Binding to ${pUrl.protocol} ${pUrl.hostname} : ${port}`);
  await server.listen(port);
  console.log('Started standalone server');
}

init();
