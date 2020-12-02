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

import * as chai from 'chai';
import * as express from 'express';

import { User } from '../../../models';

const chaiHttp = require('chai-http');

import { makeServer } from '../../../api/util/server';
import { mountAPI } from '../../../index';

chai.use(chaiHttp);
let app: express.Application;
let user: User;

before(async () => {
  const serverStuff = makeServer(true);
  app = serverStuff.app;
  app.use('/', (req, _, next) => {
    req.user = user;
    next();
  });
  app.use('/', await mountAPI(true));
});

export function setAuthenticatedUser(u: User) {
  user = u;
}

export { app };
