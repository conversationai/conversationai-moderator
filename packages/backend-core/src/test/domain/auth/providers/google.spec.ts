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
import { mapAuthDataToUser, mapAuthDataToUserSocialAuth } from '../../../../domain/auth/providers/google';

const assert = chai.assert;

// tslint:disable

describe('Auth Domain Google Tests', function() {
  describe('mapAuthDataToUser', function() {
    it('should map Google auth data to a User model data object', function() {
      let fakeProfile: any = {
        id: '110348421844561964015',
        displayName: 'User Name',
        name: {
          familyName: 'Name',
          givenName: 'User'
        },
        emails: [ { value: 'name@example.com', type: 'account' } ],
        photos: [ { value: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50' } ],
        gender: undefined,
        provider: 'google',
        _raw: '{\n "kind": "plus#person",\n "etag": "\\"xw0en60W6-NurXn4VBU-CMjSPEw/Tf5NtTfuatAoxmsxre4F8rjNgi0\\"",\n "emails": [\n  {\n   "value": "name@example.com",\n   "type": "account"\n  }\n ],\n "objectType": "person",\n "id": "110348421844561964015",\n "displayName": "User Name",\n "name": {\n  "familyName": "Name",\n  "givenName": "User"\n },\n "image": {\n  "url": "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50",\n  "isDefault": true\n },\n "isPlusUser": false,\n "language": "en",\n "verified": false,\n "domain": "example.com"\n}\n',
        _json: {
          kind: 'plus#person',
          etag: '"xw0en60W6-NurXn4VBU-CMjSPEw/Tf5NtTfuatAoxmsxre4F8rjNgi0"',
          emails: [],
          objectType: 'person',
          id: '110348421844561964015',
          displayName: 'User Name',
          name: {
            familyName: 'Name',
            givenName: 'User'
          },
          image:
          { url: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50',
            isDefault: true },
          isPlusUser: false,
          language: 'en',
          verified: false,
          domain: 'example.com'
        }
      };

      let expected = {
        group: 'general',
        email: 'name@example.com',
        name: 'User Name',
      };

      assert.deepEqual(mapAuthDataToUser(fakeProfile), expected);
    });
  });

  describe('mapAuthDataToUserSocialAuth', function() {
    it('should map Google auth data to a UserSocialAuth model data object', function() {
      let fakeAccessToken = 'ya29.Ci8rA80F6ziadxHlRyhV9Buh84F2U5sOTtJDVernUYgsqTjdhOZUjw2sMwmbs8P1KA';
      let fakeRefreshToken: any = undefined;
      let fakeProfile: any = {
        id: '110348421844561964015',
        displayName: 'User Name',
        name: {
          familyName: 'Name',
          givenName: 'User'
        },
        emails: [ { value: 'name@example.com', type: 'account' } ],
        photos: [ { value: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50' } ],
        gender: undefined,
        provider: 'google',
        _raw: '{\n "kind": "plus#person",\n "etag": "\\"xw0en60W6-NurXn4VBU-CMjSPEw/Tf5NtTfuatAoxmsxre4F8rjNgi0\\"",\n "emails": [\n  {\n   "value": "name@example.com",\n   "type": "account"\n  }\n ],\n "objectType": "person",\n "id": "110348421844561964015",\n "displayName": "User Name",\n "name": {\n  "familyName": "Name",\n  "givenName": "User"\n },\n "image": {\n  "url": "https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50",\n  "isDefault": true\n },\n "isPlusUser": false,\n "language": "en",\n "verified": false,\n "domain": "example.com"\n}\n',
        _json: {
          kind: 'plus#person',
          etag: '"xw0en60W6-NurXn4VBU-CMjSPEw/Tf5NtTfuatAoxmsxre4F8rjNgi0"',
          emails: [],
          objectType: 'person',
          id: '110348421844561964015',
          displayName: 'User Name',
          name: {
            familyName: 'Name',
            givenName: 'User'
          },
          image:
          { url: 'https://lh3.googleusercontent.com/-XdUIqdMkCWA/AAAAAAAAAAI/AAAAAAAAAAA/4252rscbv5M/photo.jpg?sz=50',
            isDefault: true },
          isPlusUser: false,
          language: 'en',
          verified: false,
          domain: 'example.com'
        }
      };

      let expected = {
        provider: 'google',
        socialId: '110348421844561964015',
        extra: {
          accessToken: fakeAccessToken,
          refreshToken: fakeRefreshToken,
          profile: fakeProfile
        }
      };

      assert.deepEqual(mapAuthDataToUserSocialAuth(fakeAccessToken, fakeRefreshToken, fakeProfile), expected);
    });
  });
});
