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

import {
  User,
  USER_GROUP_ADMIN,
  USER_GROUP_YOUTUBE,
  UserSocialAuth,
} from '../models';

/**
 * Indicates whether a user is valid to be authenticated
 *
 * @param {object} user User model instance
 */
export function isValidUser(user: User): boolean {
  return user.isActive;
}

/**
 * Find or create user social auth based on passed in data
 *
 * @param {object} user     User model instance to associate with
 * @param {object} data     Object of data formatted for UserSocialAuth model
 * @return {object}         Promise object that resolves to `instance` (UserSocialAuth instance) and
 *                          `created` (boolean) (use .spread())
 */
export async function findOrCreateUserSocialAuth(
  user: User,
  data: Pick<UserSocialAuth, 'provider' | 'socialId'>,
): Promise<[UserSocialAuth, boolean]> {
  const socialAuthData = {
    ...data,
    userId: user.id,
  };

  const [userSocialAuth, created] = await UserSocialAuth.findOrCreate({
    where: {
      userId: socialAuthData.userId,
      provider: socialAuthData.provider,
      socialId: socialAuthData.socialId,
    },
    defaults: socialAuthData,
  });

  return [userSocialAuth, created];
}

export async function isFirstUserInitialised() {
  const count = await User.count({where: {group: USER_GROUP_ADMIN, isActive: true}});
  return count > 0;
}

export async function ensureFirstUser({name, email}: {name: string, email: string}) {
  if (await isFirstUserInitialised()) {
    return;
  }

  const [user, created] = await User.findOrCreate({
    where: {email: email},
    defaults: {
      name: name,
      group: USER_GROUP_ADMIN,
      isActive: true,
    },
  });

  if (!created) {
    // We are repurposing an existing user.  So ensure they have the correct properties
    if (!await user.isActive) {
      user.isActive = true;
      await user.save();
    }
    if (await user.group !== USER_GROUP_ADMIN) {
      user.group = USER_GROUP_ADMIN;
      await user.save();
    }
  }

  return user;
}

export async function saveYouTubeUserToken({name, email}: {name: string, email: string}, token: any) {
  const [user, created] = await User.findOrCreate({
    where: {email: email, group: USER_GROUP_YOUTUBE},
    defaults: {
      name: name,
      group: USER_GROUP_YOUTUBE,
      isActive: true,
    },
  });

  if (!created) {
    if (!await user.isActive) {
      user.isActive = true;
    }
  }

  user.extra = {token: token};
  await user.save();
}
