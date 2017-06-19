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
import * as Joi from 'joi';

export function dataSchema(type: any) {
  return Joi.object().keys({
    runImmediately: Joi.boolean().optional(),
    data: Joi.alternatives().try(
      Joi.array().items(type),
      type,
    ).required(),
  });
}

/**
 * Express middleware to make sure the body of the post is 1 or more author ids.
 */
export function validateRequest(schema: Joi.Schema) {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const data = req.body;
    const status = Joi.validate(data, schema, { convert: false });

    if (status.error) {
      // console.error(status.error.details);
      res.status(422).json({ status: 'request validation error', errors: status.error.details, data });

      return;
    }

    next();
  };
}

export function validateAndSendResponse<T>(schema: Joi.Schema) {
  return (data: T, res: express.Response, next: express.NextFunction) => {
    const status = Joi.validate(data, schema, { convert: false });

    if (status.error) {
      // console.error(status.error.details);
      res.status(422).json({ status: 'response validation error', errors: status.error.details, data });

      return;
    }

    res.json({ data });

    next();
  };
}
