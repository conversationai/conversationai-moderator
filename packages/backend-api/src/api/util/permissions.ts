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

export function onlyAdmin(req: express.Request, res: express.Response, next: express.NextFunction) {
  if ((req as any).testMode) {
    next();

    return;
  }

  // TODO(ldixon): check that user is always defined; and if so update types.
  if (['admin'].indexOf(req.user!.get('group')) === -1) {
    res.status(403).json({ error: 'Only admin users can access this API.' });
  } else {
    next();
  }
}

export function onlyServices(req: express.Request, res: express.Response, next: express.NextFunction) {
  if ((req as any).testMode) {
    next();

    return;
  }

  // TODO(ldixon): check that user is always defined; and if so update types.
  if (['service'].indexOf(req.user!.get('group')) === -1) {
    res.status(403).json({ error: 'Only service users can access this API.' });
  } else {
    next();
  }
}

export function onlyAdminAndServices(req: express.Request, res: express.Response, next: express.NextFunction) {
  if ((req as any).testMode) {
    next();

    return;
  }

  // TODO(ldixon): check that user is always defined; and if so update types.
  if (['service', 'admin'].indexOf(req.user!.get('group')) === -1) {
    res.status(403).json({ error: 'General users cannot acces this API.' });
  } else {
    next();
  }
}
