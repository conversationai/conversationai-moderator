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
import { UniqueConstraintError } from 'sequelize';

import {
  ensureFirstUser,
  findOrCreateUserSocialAuth,
  isFirstUserInitialised,
  isValidUser,
} from '../../auth/users';
import { User, UserSocialAuth } from '../../models';
import { createUser } from '../domain/comments/fixture';

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
      assert.equal(userSocialAuth.userId, createdUser.id);
      assert.equal(userSocialAuth.provider, userSocialAuthData.provider);
      assert.equal(userSocialAuth.socialId, userSocialAuthData.socialId);
      assert.deepEqual(userSocialAuth.extra, userSocialAuthData.extra);
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
      assert.equal(userSocialAuth.userId, createdUser.id);
      assert.equal(userSocialAuth.provider, userSocialAuthData.provider);
      assert.equal(userSocialAuth.socialId, userSocialAuthData.socialId);
      assert.deepEqual(userSocialAuth.extra, userSocialAuthData.extra);
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
      assert.equal(createdUser1.id, createdSocialAuth1.userId);

      try {
        await findOrCreateUserSocialAuth(createdUser2, userSocialAuthData2);
        assert(false, 'findOrCreateUserSocialAuth resolved successfully when it should have thrown a unique constraint error');
      } catch (err) {
        assert.instanceOf(err, UniqueConstraintError);
      }
    });
  });

  describe('Ensure availability of first admin user', () => {
    const user1Data = {
      group: 'admin',
      name: 'Enabled Admin',
      email: 'sansa@stark.com',
      isActive: true
    };

    const user2Data = {
      group: 'admin',
      name: 'Disabled Admin',
      email: 'theon@stark.com',
      isActive: false
    };

    const user3Data = {
      group: 'general',
      name: 'Enabled ordinary usere',
      email: 'arya@stark.com',
      isActive: true
    };

    const createdUser = {
      group: 'admin',
      name: 'Administrator',
      email: 'test@example.com',
      isActive: true
    };

    async function assertUser(user: any) {
      const dbu = (await User.findOne({where: {email: user.email}}))!;
      assert.equal(dbu.name, user.name);
      assert.equal(dbu.group, user.group);
      assert.equal(dbu.isActive, user.isActive);
    }

    it('Make sure nothing happens if we already have a first user', async () => {
      for (const u of [user1Data, user2Data, user3Data]) {
        await createUser(u);
      }

      assert.equal(await User.count({where: {}}), 3, 'users created');
      assert.equal(await User.count({where: {isActive: true}}), 2, 'users active');
      assert.equal(await User.count({where: {group: 'admin'}}), 2, 'users admin');
      assert.equal(await User.count({where: {group: 'admin', isActive: true}}), 1, 'users active admin');

      assert.isTrue(await isFirstUserInitialised());
      await ensureFirstUser(createdUser);

      const count = await User.count({where: {}});
      assert.equal(count, 3, 'same number of users');
      for (const u of [user1Data, user2Data, user3Data]) {
        await assertUser(u);
      }
    });

    it('Make sure we create a new user when currently no admin', async () => {
      for (const u of [user2Data, user3Data]) {
        await createUser(u);
      }

      assert.isFalse(await isFirstUserInitialised());
      await ensureFirstUser(createdUser);

      const count = await User.count({where: {}});
      assert.equal(count, 3);
      for (const u of [createdUser, user2Data, user3Data]) {
        await assertUser(u);
      }
    });

    it('Make sure we enable disabled admin user', async () => {
      for (const u of [user2Data, user3Data]) {
        await createUser(u);
      }

      assert.isFalse(await isFirstUserInitialised());
      await ensureFirstUser(user2Data);

      const count = await User.count({where: {}});
      assert.equal(count, 2);
      await assertUser(user3Data);
      await assertUser({
        group: 'admin',
        name: user2Data.name,
        email: user2Data.email,
        isActive: true
      });
    });

    it('Make sure we upgrade a general user to admin user', async () => {
      for (const u of [user2Data, user3Data]) {
        await createUser(u);
      }

      assert.isFalse(await isFirstUserInitialised());
      await ensureFirstUser(user3Data);

      const count = await User.count({where: {}});
      assert.equal(count, 2);
      await assertUser(user2Data);
      await assertUser({
        group: 'admin',
        name: user3Data.name,
        email: user3Data.email,
        isActive: true
      });
    });
  });
});
