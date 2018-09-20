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
import {
  findOrCreateUserSocialAuth,
  isValidUser,
} from '../../../domain/auth/users';
import {
  User,
  UserSocialAuth,
} from '../../../models';
import { sequelize } from '../../../sequelize';

const assert = chai.assert;

// tslint:disable

describe('Auth Domain Users Tests', function() {
  beforeEach(async () => {
    await UserSocialAuth.destroy({where:{}});
    await User.destroy({where:{}});
  });

  describe('isValidUser', function() {
    it('should return true for an active user', async () => {
      const activeUser = await User.create({
        group: 'admin',
        name: 'User Name',
        email: 'email1@example.com',
        isActive: true
      });

      assert.isTrue(isValidUser(activeUser));
    });

    it('should return false for an inactive user', async () => {
      const inactiveUser = await User.create({
        group: 'general',
        name: 'User Name',
        email: 'email2@example.com',
        isActive: false
      });

      assert.isFalse(isValidUser(inactiveUser));
    });
  });

  describe('findOrCreateUserSocialAuth', function() {
    it('should create a non-existent social auth and relate it to the passed in user', async () => {
      const userData = {
        group: 'admin',
        name: 'Daenerys Targaryen',
        email: 'khaleesi@dothrakisea.com',
        isActive: true
      };

      const userSocialAuthData = {
        provider: 'google',
        socialId: '123',
        extra: {
          accessToken: 'fdakjh48fh'
        }
      };

      const createdUser = await User.create(userData);
      const [userSocialAuth, created] = await findOrCreateUserSocialAuth(createdUser, userSocialAuthData);

      assert.isTrue(created);
      assert.equal(userSocialAuth.get('userId'), createdUser.id);
      assert.equal(userSocialAuth.get('provider'), userSocialAuthData.provider);
      assert.equal(userSocialAuth.get('socialId'), userSocialAuthData.socialId);
      assert.deepEqual(userSocialAuth.get('extra'), userSocialAuthData.extra);
    });

    it('should resolve to an existing social auth if present', async () => {
      const userData = {
        group: 'general',
        name: 'Arya Stark',
        email: 'arya@manyfacedgod.com',
        isActive: true
      };

      const userSocialAuthData = {
        provider: 'google',
        socialId: '456',
        extra: {
          accessToken: 'or8hbf7'
        }
      };

      const createdUser = await User.create(userData);

      const socialAuthData = {
        ...userSocialAuthData,
        userId: createdUser.id,
      };

      const createdSocialAuth = await UserSocialAuth.create(socialAuthData);

      const [userSocialAuth, created] = await findOrCreateUserSocialAuth(createdUser, userSocialAuthData);

      assert.isFalse(created);
      assert.equal(userSocialAuth.id, createdSocialAuth.id);
      assert.equal(userSocialAuth.get('userId'), createdUser.id);
      assert.equal(userSocialAuth.get('provider'), userSocialAuthData.provider);
      assert.equal(userSocialAuth.get('socialId'), userSocialAuthData.socialId);
      assert.deepEqual(JSON.parse(userSocialAuth.get('extra')), userSocialAuthData.extra);
    });

    it('should not allow multiple social auth records for the same user from the same provider', async () => {
      const user1Data = {
        group: 'general',
        name: 'Sansa Stark',
        email: 'sansa@stark.com',
        isActive: true
      };

      const user2Data = {
        group: 'general',
        name: 'Theon Greyjoy',
        email: 'theon@stark.com',
        isActive: true
      };

      const userSocialAuthData1 = {
        provider: 'google',
        socialId: '456',
        extra: {
          accessToken: 'or8hbf7'
        }
      };

      const userSocialAuthData2 = {
        provider: userSocialAuthData1.provider,
        socialId: userSocialAuthData1.socialId,
        extra: {
          accessToken: 'aflijoi8'
        }
      };

      const createdUser1 = await User.create(user1Data);
      const createdUser2 = await User.create(user2Data);

      const [createdSocialAuth1, created] = await findOrCreateUserSocialAuth(createdUser1, userSocialAuthData1);

      assert.isTrue(created);
      assert.equal(createdUser1.id, createdSocialAuth1.get('userId'));

      try {
        await findOrCreateUserSocialAuth(createdUser2, userSocialAuthData2)
        throw new Error('findOrCreateUserSocialAuth resolved successfully when it should have thrown a unique constraint error');
      } catch (err) {
        assert.instanceOf(err, sequelize.UniqueConstraintError);
      }
    });
  });
});
