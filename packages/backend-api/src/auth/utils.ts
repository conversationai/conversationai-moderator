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
import * as moment from 'moment';
import { generate } from 'randomstring';

import { CSRF } from '../models';

export async function generateServerCSRF(req: express.Request, res: express.Response, next: express.NextFunction) {
  const clientCSRF = req.query.csrf;
  const referrer = req.query.referrer;

  if (!clientCSRF) {
    res.status(403).send('No CSRF included in login request.');
    next();
    return;
  }

  const serverCSRF = generate();

  await CSRF.create({
    serverCSRF,
    clientCSRF,
    referrer,
  });

  return serverCSRF;
}

export async function getClientCSRF(req: express.Request):
  Promise<{clientCSRF: string|undefined, referrer: string|null|undefined, errorMessage: string|undefined}> {
  const serverCSRF = req.query.state as string;
  if (!serverCSRF) {
    return {clientCSRF: undefined, referrer: undefined, errorMessage: 'CSRF missing.'};
  }

  const csrf = await CSRF.findOne({
    where: {serverCSRF},
  });

  if (!csrf) {
    return {clientCSRF: undefined, referrer: undefined, errorMessage: 'CSRF not valid.'};
  }

  const maxAge = moment().subtract(5, 'minutes').toDate();
  const age = csrf.createdAt;
  const clientCSRF = csrf.clientCSRF;
  const referrer = csrf.referrer;
  await csrf.destroy();

  if (age < maxAge) {
    return {clientCSRF: undefined, referrer: referrer, errorMessage: 'CSRF from server is older than 5 minutes.'};
  }

  return {clientCSRF: clientCSRF, referrer: referrer, errorMessage: undefined};
}
