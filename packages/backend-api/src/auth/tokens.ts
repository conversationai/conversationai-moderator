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

import { randomBytes } from 'crypto';
import * as jwt from 'jsonwebtoken';
import { isNumber } from 'lodash';
import * as moment from 'moment';

import {
  CONFIGURATION_TOKEN,
  getConfigItem,
  User,
  setConfigItem,
} from '../models';

export interface ITokenConfiguration {
  secret: string;
  issuer: string;
  expiration_minutes: number;
}

let config: ITokenConfiguration | null;

export async function getTokenConfiguration(): Promise<ITokenConfiguration> {
  if (config) {
    return config;
  }

  config = await getConfigItem(CONFIGURATION_TOKEN) as ITokenConfiguration;
  if (config) {
    return config;
  }

  config = await new Promise<ITokenConfiguration>((resolve, reject) => {
    randomBytes(48, (err, buffer) => {
      if (err) {
        reject(err);
      }

      resolve({
        secret: buffer.toString('base64'),
        issuer: 'OSMod',
        expiration_minutes: 12 * 60,
      });
    });
  });

  await setConfigItem(CONFIGURATION_TOKEN, config);
  return config;
}

export interface ITokenPayload {
  iat: number;
  user: number;
  email?: string;
}

export function isValidToken(tokenPayload: ITokenPayload): boolean {
  return !(!isNumber(tokenPayload.user) || tokenPayload.user < 1);
}

/**
 * Indicate whether token iat (issue at timestamp) is before our configured
 * threshold of days
 *
 * @param {object} user User model instance
 * @param {object} tokenPayload Decoded token payload object with an `iat` key
 * @return {boolean}
 */
export async function isExpired(user: User, tokenPayload: ITokenPayload): Promise<boolean> {
  if (user.group === 'service') {
    return false;
  }

  const c = await getTokenConfiguration();
  const cutoff = moment().subtract(c.expiration_minutes, 'minutes').unix();

  return tokenPayload.iat < cutoff;
}

/**
 * Create a JWT token for the passed in User model instance or user id
 *
 * @param userId User's ID
 * @param email: User's email address
 * @return JWT token string
 */
export async function createToken(userId: number, email?: string): Promise<string> {
  const c = await getTokenConfiguration();
  return jwt.sign({
    user: userId,
    email,
  },
  c.secret,
  {
    issuer: c.issuer,
  });
}

/**
 * Verify a JWT token. Returns false for an invalid or expired token
 * otherwise returns the decoded token
 *
 * @param  {string} token JWT token to verify
 * @return If token is valid, return decoded token data
 */
export async function verifyToken(token: string): Promise<ITokenPayload | null> {
  const c = await getTokenConfiguration();
  try {
    const decoded = jwt.verify(token, c.secret) as ITokenPayload;
    if (isValidToken(decoded)) {
      return decoded;
    }
    return null;
  }
  catch (err) {
    return null;
  }
}

/**
 * Checks validity of passed in token and returns a fresh one if it passes
 *
 * @param {string} token JWT token to decode and refresh
 */
export async function refreshToken(token: string): Promise<string | null> {
  const verified = await verifyToken(token);

  if (verified) {
    return createToken(verified.user, verified.email);
  }

  return null;
}
