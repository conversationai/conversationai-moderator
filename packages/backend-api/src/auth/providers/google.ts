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

import { config } from '../../config';
import { User } from '../../models';
import { IGoogleOAuthConfiguration, setOAuthGood } from '../config';
import { ensureFirstUser, findOrCreateUserSocialAuth, isFirstUserInitialised } from '../users';

const Strategy = require('passport-google-oauth20').Strategy;

class AuthError extends Error {

}

export interface IGoogleProfile {
  id: string;
  displayName: string;
  name: {
    familyName: string;
    givenName: string;
  };
  emails: Array<{
    value: string;
    verified: string;
  }>;
  photos: Array<{
    value: string;
  }>;
}

/**
 * Map Google OAuth data to a data object to jam into a User model
 */
export function mapAuthDataToUser(profile: IGoogleProfile) {
  const email = profile.emails[0].value;

  return {
    email,
    name: profile.displayName,
  };
}

/**
 * Map Google OAuth data to a data object to jam into a UserSocialAuth model
 */
export function mapAuthDataToUserSocialAuth(accessToken: string, refreshToken: string, profile: IGoogleProfile) {
  return {
    provider: 'google',
    socialId: profile.id,
    extra: {
      accessToken,
      refreshToken,
      profile,
    },
  };
}

/**
 * Login verification after successful Google Oauth flow. Takes the passed in data an:
 *
 *   1. Finds or creates the user based on their email address
 *   2. Finds or creates a social auth record and relates it to the user
 */
export async function verifyGoogleToken(accessToken: string, refreshToken: string, profile: IGoogleProfile): Promise<User> {

  const userData = mapAuthDataToUser(profile);

  if (!userData) {
    throw new Error('Error extracting user auth data');
  }

  if (!await isFirstUserInitialised()) {
    await ensureFirstUser(userData);
  }

  await setOAuthGood(true);

  const user = await User.findOne({
    where: { email: userData.email },
  });

  if (!user) {
    throw new AuthError(`User ${userData.email} is not yet registered with Moderator.`);
  }

  if (!user.isActive) {
    throw new AuthError(`User ${userData.email} has been deactivated.`);
  }

  const userSocialAuthData = mapAuthDataToUserSocialAuth(accessToken, refreshToken, profile);
  await findOrCreateUserSocialAuth(user, userSocialAuthData);

  return user;
}

export function getGoogleStrategy(
  oauthConfig: IGoogleOAuthConfiguration,
) {
  return new Strategy(
    {
      clientID: oauthConfig.id,
      clientSecret: oauthConfig.secret,
      callbackURL: `${config.get('api_url')}/auth/callback/google`,
      userProfileURL: 'https://www.googleapis.com/oauth2/v3/userinfo',
    },
    async (accessToken: string, refreshToken: string, profile: IGoogleProfile,
           callback: (err: any, user?: User | false, info?: any) => any) => {
      try {
        const user = await verifyGoogleToken(accessToken, refreshToken, profile);

        // Sync avatar
        if (profile.photos && profile.photos[0] && profile.photos[0].value) {
          await user.update({avatarURL: profile.photos[0].value});
        }

        callback(null, user);
      }
      catch (e) {
        if (e instanceof AuthError) {
          callback(null, false, {reason: e.message});
        }
        else {
          callback(e);
        }
      }
    },
  );
}
