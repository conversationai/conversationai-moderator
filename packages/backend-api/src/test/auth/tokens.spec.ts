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
import * as jwt from 'jsonwebtoken';
import * as moment from 'moment';
import * as sinon from 'sinon';

import {
  createToken,
  getTokenConfiguration,
  isExpired,
  ITokenConfiguration,
  refreshToken,
  verifyToken,
} from '../../auth/tokens';

const assert = chai.assert;

describe('Auth Domain Token Tests', () => {
  let config: ITokenConfiguration;
  before(async () => {
    config = await getTokenConfiguration();
  });

  /**
   * Return a timestamp before out expiration cutoff
   */
  function getExpiredTimestamp() {
    return moment()
      .subtract(config.expiration_minutes, 'minutes')
      .subtract(1, 'second')
      .unix();
  }

  const fakeGeneralUser = {
    get: sinon.stub().withArgs('group').returns('general'),
  } as any;

  const fakeAdminUser = {
    get: sinon.stub().withArgs('group').returns('admin'),
  } as any;

  const fakeServiceUser = {
    get: sinon.stub().withArgs('group').returns('service'),
  } as any;

  describe('isExpired', () => {
    it('should return false for an unexpired token', async () => {
      const fakeToken = {
        iat: moment().unix(),
        user: 1,
      };

      assert.isFalse(await isExpired(fakeGeneralUser, fakeToken));
      assert.isFalse(await isExpired(fakeAdminUser, fakeToken));
      assert.isFalse(await isExpired(fakeServiceUser, fakeToken));
    });

    it('should return true for an expired token', async () => {
      const fakeToken = {
        iat: getExpiredTimestamp(),
        user: 1,
      };

      assert.isTrue(await isExpired(fakeGeneralUser, fakeToken));
      assert.isTrue(await isExpired(fakeAdminUser, fakeToken));
      assert.isFalse(await isExpired(fakeServiceUser, fakeToken));
    });

    it('should always return false for a user in the "service" group', async () => {
      const fakeValidToken = {
        iat: getExpiredTimestamp(),
        user: 1,
      };

      const fakeExpiredToken = {
        iat: getExpiredTimestamp(),
        user: 1,
      };

      assert.isFalse(await isExpired(fakeServiceUser, fakeValidToken));
      assert.isFalse(await isExpired(fakeServiceUser, fakeExpiredToken));
    });
  });

  describe('create', () => {
    it('should return a valid JWT token containing the user\'s id', async () => {
      const userId = 159;
      const token = await createToken(userId);
      assert.isNotNull(token);

      assert.doesNotThrow(() => {
        const decoded = jwt.verify(token, config.secret);
        assert.equal(decoded.user, userId);
      });
    });
  });

  describe('verifyToken', () => {
    it('should return true for a valid token', async () => {
      const userId = 784;
      const validToken = jwt.sign({user: userId}, config.secret);
      const verified = await verifyToken(validToken);
      assert.isObject(verified);
      if (verified) {
        assert.equal(verified.user, userId);
      }
    });

    it('should return false for a mismatched secret', async () => {
      const userId = 298;
      const invalidToken = jwt.sign({user: userId}, config.secret + 'a');
      const verified = await verifyToken(invalidToken);
      assert.isNull(verified);
    });

    it('should return false for a token with no user id', async () => {
      const invalidToken = jwt.sign({}, config.secret);
      const verified = await verifyToken(invalidToken);
      assert.isNull(verified);
    });
  });

  describe('refresh', () => {
    /**
     * Return a timestamp at least a second in the past, which makes JWT generate a different token
     */
    function getRefreshableTimestamp() {
      return moment().subtract(1, 'second').unix();
    }

    it('should return a new token in exchange for a valid token', async () => {
      const userId = 4238;

      const token = jwt.sign({
        iat: getRefreshableTimestamp(),
        user: userId,
      }, config.secret);

      const refreshed = await refreshToken(token);
      assert.isNotNull(refreshed);
      if (refreshed) {
        const decoded = jwt.verify(refreshed, config.secret);

        assert.isString(refreshed);
        assert.isObject(decoded);
        assert.equal(decoded.user, userId);
        assert.notEqual(token, refreshed);
      }
    });

    it('should return false for a mismatched secret', async () => {
      const userId = 387;

      const token = jwt.sign({
        iat: getRefreshableTimestamp(),
        user: userId,
      }, config.secret + 'a');

      const refreshed = await refreshToken(token);

      assert.isNull(refreshed);
    });

    it('should return false for an expired token', async () => {
      const userId = 387;

      const token = jwt.sign({
        iat: getExpiredTimestamp(),
        user: userId,
      }, config.secret + 'a');

      const refreshed = await refreshToken(token);

      assert.isNull(refreshed);
    });

    it('should return false for a token with no user id', async () => {
      const token = jwt.sign({
        iat: getRefreshableTimestamp(),
      }, config.secret);

      const refreshed = await refreshToken(token);

      assert.isNull(refreshed);
    });
  });
});
