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
  isExpired,
  refreshToken,
  verifyToken,
} from '../../../domain/auth/tokens';

import { config } from '@conversationai/moderator-config';

const assert = chai.assert;

// tslint:disable

describe('Auth Domain Token Tests', function() {
  /**
   * Return a timestamp before out expiration cutoff
   */
  function getExpiredTimestamp() {
    return moment()
      .subtract(config.get('token_expiration_minutes'), 'minutes')
      .subtract(1, 'second')
      .unix();
  }

  let fakeGeneralUser = {
    get: sinon.stub().withArgs('group').returns('general')
  } as any;

  let fakeAdminUser = {
    get: sinon.stub().withArgs('group').returns('admin')
  } as any;

  let fakeServiceUser = {
    get: sinon.stub().withArgs('group').returns('service')
  } as any;

  describe('isExpired', function() {
    it('should return false for an unexpired token', function() {
      let fakeToken = {
        iat: moment().unix(),
        user: 1
      };

      assert.isFalse(isExpired(fakeGeneralUser, fakeToken));
      assert.isFalse(isExpired(fakeAdminUser, fakeToken));
      assert.isFalse(isExpired(fakeServiceUser, fakeToken));
    });

    it('should return true for an expired token', function() {
      let fakeToken = {
        iat: getExpiredTimestamp(),
        user: 1
      };

      assert.isTrue(isExpired(fakeGeneralUser, fakeToken));
      assert.isTrue(isExpired(fakeAdminUser, fakeToken));
      assert.isFalse(isExpired(fakeServiceUser, fakeToken));
    });

    it('should always return false for a user in the "service" group', function() {
      let fakeValidToken = {
        iat: getExpiredTimestamp(),
        user: 1
      };

      let fakeExpiredToken = {
        iat: getExpiredTimestamp(),
        user: 1
      };

      assert.isFalse(isExpired(fakeServiceUser, fakeValidToken));
      assert.isFalse(isExpired(fakeServiceUser, fakeExpiredToken));
    });
  });

  describe('create', function() {
    it("should return a valid JWT token containing the user's id", function() {
      let userId = 159;
      let token = createToken(userId) as any;
      let decoded: any;

      assert.doesNotThrow(() => {
        decoded = jwt.verify(token, config.get('token_secret'));
      });

      assert.equal(decoded ? decoded.user : null, userId);
    });
  });

  describe('verifyToken', function() {
    it('should return true for a valid token', function() {
      let userId = 784;
      let validToken = jwt.sign({user: userId}, config.get('token_secret'));
      let verified = verifyToken(validToken) as any;
      assert.isObject(verified);
      assert.equal(verified.user, userId);
    });

    it('should return false for a mismatched secret', function() {
      let userId = 298;
      let invalidToken = jwt.sign({user: userId}, config.get('token_secret') + 'a');
      let verified = verifyToken(invalidToken);
      assert.isFalse(verified);
    });

    it('should return false for a token with no user id', function() {
      let invalidToken = jwt.sign({}, config.get('token_secret'));
      let verified = verifyToken(invalidToken);
      assert.isFalse(verified);
    });
  });

  describe('refresh', function() {
    /**
     * Return a timestamp at least a second in the past, which makes JWT generate a different token
     */
    function getRefreshableTimestamp() {
      return moment().subtract(1, 'second').unix();
    }

    it('should return a new token in exchange for a valid token', function() {
      let userId = 4238;

      let token = jwt.sign({
        iat: getRefreshableTimestamp(),
        user: userId
      }, config.get('token_secret'));

      let refreshed = refreshToken(token) as any;
      let decoded = jwt.verify(refreshed, config.get('token_secret'));

      assert.isString(refreshed);
      assert.isObject(decoded);
      assert.equal(decoded.user, userId);
      assert.notEqual(token, refreshed);
    });

    it('should return false for a mismatched secret', function() {
      let userId = 387;

      let token = jwt.sign({
        iat: getRefreshableTimestamp(),
        user: userId
      }, config.get('token_secret') + 'a');

      let refreshed = refreshToken(token) as any;

      assert.isFalse(refreshed);
    });

    it('should return false for an expired token', function() {
      let userId = 387;

      let token = jwt.sign({
        iat: getExpiredTimestamp(),
        user: userId
      }, config.get('token_secret') + 'a');

      let refreshed = refreshToken(token) as any;

      assert.isFalse(refreshed);
    });

    it('should return false for a token with no user id', function() {
      let token = jwt.sign({
        iat: getRefreshableTimestamp(),
      }, config.get('token_secret'));

      let refreshed = refreshToken(token) as any;

      assert.isFalse(refreshed);
    });
  });
});
