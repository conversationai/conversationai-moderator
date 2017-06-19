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

import { config } from '@conversationai/moderator-config';
import * as jwt from 'jsonwebtoken';
import { isNumber } from 'lodash';
import * as moment from 'moment';
import { IUserInstance } from '../../models';

export interface ITokenPayload {
  iat: number;
  user: number;
  email?: string;
}

export function isValidToken(tokenPayload: ITokenPayload): boolean {
  if (!isNumber(tokenPayload.user) || tokenPayload.user < 1) {
    return false;
  }

  return true;
}

/**
 * Indicate whether token iat (issue at timestamp) is before our configured
 * threshold of days
 *
 * @param {object} user User model instance
 * @param {object} tokenPayload Decoded token payload object with an `iat` key
 * @return {boolean}
 */
export function isExpired(user: IUserInstance, tokenPayload: ITokenPayload): boolean {
  if (user.get('group') === 'service') {
    return false;
  }

  const cutoff = moment().subtract(config.get('token_expiration_minutes'), 'minutes').unix();

  return tokenPayload.iat < cutoff;
}

/**
 * Create a JWT token for the passed in User model instance or user id
 *
 * @param {integer} user A user id
 * @return {mixed} Returns false if a user id can't be extracted, otherwise returns a JWT token string
 */
export function createToken(userId: number, email?: string): boolean | string {
  return jwt.sign({
    user: userId,
    email,
  },
  config.get('token_secret'),
  {
    issuer: config.get('token_issuer'),
  });
}

/**
 * Verify a JWT token. Returns false for an invalid or expired token
 * otherwise returns the decoded token
 *
 * @param  {string} token JWT token to verify
 * @return {mixed} Returns an object of decoded token data if valid, otherwise false
 */
export function verifyToken(token: string): boolean | ITokenPayload {
  try {
    const decoded = jwt.verify(token, config.get('token_secret'));

    if (isValidToken(decoded)) {
      return decoded;
    } else {
      return false;
    }
  } catch (err) {
    return false;
  }
}

/**
 * Checks validity of passed in token and returns a fresh one if it passes
 *
 * @param {string} token JWT token to decode and refresh
 */
export function refreshToken(token: string): boolean | string {
  const verified = verifyToken(token);

  if (verified) {
    const payload = verified as ITokenPayload;

    return createToken(payload.user, payload.email);
  } else {
    return false;
  }
}
