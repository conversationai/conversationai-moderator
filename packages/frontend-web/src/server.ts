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
import { Application, Request, Response } from 'express';
import {readFileSync} from 'fs';

export function mountWebFrontend(modifyOutput?: (output: string) => string): Application {
  const app = express();

  app.disable('etag');
  app.set('trust proxy', true);

  const files = __dirname + '/../public';
  const css = files + '/css';
  const images = files + '/images';

  const builds = __dirname + '/../build';
  const js = builds + '/js';

  function renderRoot(_req: Request, res: Response): void {
    const html = readFileSync(files + '/index.html', 'utf8');

    let path = '';

    if (process.env.API_URL) {
      path = process.env.API_URL;
    }

    let name = '';

    if (process.env.APP_NAME) {
      name = process.env.APP_NAME;
    }

    let reasonToReject = 'true';

    if (process.env.REQUIRE_REASON_TO_REJECT) {
      reasonToReject = (process.env.REQUIRE_REASON_TO_REJECT);
    }

    let restrictToSession = 'true';

    if (process.env.RESTRICT_TO_SESSION) {
      restrictToSession = process.env.RESTRICT_TO_SESSION;
    }

    let moderatorGuidelinesUrl = '';

    if (process.env.MODERATOR_GUIDELINES_URL) {
      moderatorGuidelinesUrl = process.env.MODERATOR_GUIDELINES_URL;
    }

    let submitFeedbackUrl = '';

    if (process.env.SUBMIT_FEEDBACK_URL) {
      submitFeedbackUrl = process.env.SUBMIT_FEEDBACK_URL;
    }

    let commentsEditableFlag = 'true';
    if (process.env.COMMENTS_EDITABLE_FLAG) {
      commentsEditableFlag = process.env.COMMENTS_EDITABLE_FLAG;
    }

    let output = html
        .replace('{{API_URL}}', path)
        .replace('{{APP_NAME}}', name)
        .replace('{{REQUIRE_REASON_TO_REJECT}}', reasonToReject)
        .replace('{{RESTRICT_TO_SESSION}}', restrictToSession)
        .replace('{{MODERATOR_GUIDELINES_URL}}', moderatorGuidelinesUrl)
        .replace('{{SUBMIT_FEEDBACK_URL}}', submitFeedbackUrl)
        .replace('{{COMMENTS_EDITABLE_FLAG}}', commentsEditableFlag);

    if (modifyOutput) {
      output = modifyOutput(output);
    }

    res.send(output);
  }

  app.use('/css', express.static(css));
  app.use('/images', express.static(images));
  app.use('/js', express.static(js));
  app.get('/*', renderRoot);

  return app;
}
