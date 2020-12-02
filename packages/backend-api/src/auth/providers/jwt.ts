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

import { ExtractJwt, Strategy } from 'passport-jwt';

import { User } from '../../models';
import { getTokenConfiguration, isValidToken } from '../tokens';
import { isValidUser } from '../users';

/**
 * Verify JWT payload from JWT Passportstrategy
 *
 * @param {object}   jwtPayload Decoded JWT payload
 * @param {function} done       Verification callback
 */
export async function verifyJWT(jwtPayload: any): Promise<User> {
  if (!isValidToken(jwtPayload)) {
    throw new Error('Invalid token');
  }

  const user = await User.findByPk(jwtPayload.user);

  if (user) {
    if (isValidUser(user)) {
      if (user.email) {
        if (user.email === jwtPayload.email) {
          return user;
        } else {
          throw new Error(`User email does not match token: ${user.email} === ${jwtPayload.email}`);
        }
      } else {
        return user;
      }
    }

    throw new Error('User not valid');
  } else {
    throw new Error('User not found');
  }
}

/**
 * JWT Passport strategy configuration
 */
export async function getJwtStrategy() {
  const config = await getTokenConfiguration();

  return new Strategy(
    {
      secretOrKey: config.secret,
      issuer: config.issuer,

      jwtFromRequest: (ExtractJwt as any).fromExtractors([
        // Pull JWT token out of request header formatted like so: "Authorization: JWT (token)"
        ExtractJwt.fromAuthHeaderWithScheme('jwt'),

        // Or, grab from `token` query string.
        ExtractJwt.fromUrlQueryParameter('token'),
      ]),
    },
    async (jwtPayload: any, callback: (err: any, user?: User | false) => any) => {
      try {
        const user = await verifyJWT(jwtPayload);
        callback(null, user);
      } catch (e) {
        callback(e);
      }
    },
  );
}
