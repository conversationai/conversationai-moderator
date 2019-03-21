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

import * as express from 'express';
import * as expressWs from 'express-ws';
import { Server } from 'http';

const bodyParser = require('body-parser');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
import { logger } from './logger';

export function getExpressAppWithPreprocessors(testMode?: boolean) {
  const app = express();
  expressWs(app);

  if (!testMode) {
    // Turn on GZip.
    app.use(compression());
  }

  // Required to parse JSON posts.
  app.use(bodyParser.json({ limit: '2mb' }));

  if (!testMode) {
    // Enable CORS
    app.use(cors());
    app.options('*', cors());

    app.use(helmet());
    app.use(logger.requestLogger);
  }

  return app;
}

export function applyCommonPostprocessors(app: express.Application, testMode?: boolean) {
  if (!testMode) {
    // Add the error logger after all middleware and routes so that
    // it can log errors from the whole application. Any custom error
    // handlers should go after this.
    app.use(logger.errorLogger);

    // Basic 404 handler
    app.use((_req: express.Request, res: express.Response) => {
      if (!res.headersSent) {
        res.status(404).send('Not Found');
      }
    });

    // Basic error handler
    app.use((_err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
      // If our routes specified a specific response, then send that. Otherwise,
      // send a generic message so as not to leak anything.

      if (!res.headersSent) {
        res.status(500).json({error: 'Internal Server Error'});
      }
    });
  }
}

export function makeServer(testMode?: boolean): {
  app: express.Application;
  start(port: number): Server;
} {
  const app = getExpressAppWithPreprocessors(testMode);
  return {
    app,
    start(port: number) {
      applyCommonPostprocessors(app, testMode);

      return app.listen(port, () => {
        console.log('OSMod listening on port', port);
      });
    },
  };
}
