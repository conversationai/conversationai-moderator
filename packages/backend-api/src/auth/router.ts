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

import { createToken, CSRF, IUserInstance } from '@conversationai/moderator-backend-core';
import { config } from '@conversationai/moderator-config';
import * as express from 'express';
import * as moment from 'moment';
import * as passport from 'passport';
import * as qs from 'qs';
const { generate } = require('randomstring');

export function createAuthRouter(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  // Test endpoint, you should not be able to see the result of this without
  // a vaid JWT Authorization header:
  //
  // Authorization: JWT (token string)

  router.get(
    '/auth/test',
    passport.authenticate('jwt', { session: false }),
    (_, res) => {
      res.send('You should not be able to see this unless you have a valid JWT token');
    },
  );

  // Configure Google OAuth2 login

  router.get(
    '/auth/login/google',
    async (req, res, next) => {
      const clientCSRF = req.query.csrf;

      if (!clientCSRF) {
        res.status(403).send('No CSRF included in login request.');
        next();

        return;
      }

      const serverCSRF = generate();

      const referrer = req.query.referrer;

      await CSRF.create({
        serverCSRF,
        clientCSRF,
        referrer,
      });

      passport.authenticate('google', {
        session: false,

        // Get profile information and email address
        // https://developers.google.com/+/web/api/rest/oauth#authorization-scopes
        scope: ['profile', 'email'],

        state: serverCSRF,

        // Force approval UI and account switcher in OAuth login
        accessType: 'online',
        prompt: 'consent',
      } as any)(req, res, next);
    },
  );

  // Google OAuth Callback URL

  router.get(
    '/auth/callback/google',
    (req, res, next) => {
      passport.authenticate('google', {
        session: false,
      }, async (err: any, user: IUserInstance | false, info: any) => {
        if (err) {
          console.log('Auth error', err);

          return redirectToFrontend(
            res,
            false,
          );
        }

        if (!user) {
          return redirectToFrontend(
            res,
            false,
            {
              errorMessage: info.reason,
            },
          );
        }

        const { query } = req;
        const serverCSRF = query.state;

        if (!serverCSRF) {
          console.error('No CSRF (state) included in login redirect.');

          return redirectToFrontend(
            res,
            false,
            {
              errorMessage: 'CSRF missing.',
            },
          );
        }

        const csrf = await CSRF.findOne({
          where: { serverCSRF },
        });

        if (!csrf) {
          console.error('CSRF did not match database.');

          return redirectToFrontend(
            res,
            false,
            {
              errorMessage: 'CSRF not valid.',
            },
          );
        }

        const maxAge = moment().subtract(5, 'minutes').toDate();

        if (csrf.get('createdAt') < maxAge) {
          const referrer = csrf.get('referrer');
          await csrf.destroy();

          console.error('CSRF from server is older than 5 minutes.');

          return redirectToFrontend(
            res,
            false,
            {
              errorMessage: 'CSRF from server is older than 5 minutes.',
            },
            referrer,
          );
        } else {
          await csrf.destroy();
        }

        const token = createToken(user.id, user.get('email'));

        return redirectToFrontend(
          res,
          true,
          {
            token,
            csrf: csrf.get('clientCSRF'),
          },
          csrf.get('referrer'),
        );
      })(req, res, next);
    },
  );

  function redirectToFrontend(
    res: express.Response,
    success: boolean,
    params: object = {},
    referrer?: string,
  ): void {
    let redirectHost;

    if (
      (config.get('redirect_oauth_to') === 'frontend_url') ||
      !referrer
    ) {
      redirectHost = config.get('frontend_url');
    } else {
      redirectHost = referrer;
    }

    if (redirectHost === '') {
      redirectHost = '/';
    }

    const queryString = qs.stringify(Object.assign({
      error: !success,
    }, params));

    res.redirect(`${redirectHost}?${queryString}`);
  }

  return router;
}
