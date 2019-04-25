/*
Copyright 2019 Google Inc.

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

/**
 * Provide an abstraction on top of the local/session storage on the browser.
 * On non-browser platforms, provide a fake interface that just stores stuff
 * in a javascript object.
 */
import { RESTRICT_TO_SESSION } from '../config';

const LOCAL_STORAGE_AUTH_TOKEN_KEY = 'moderator/auth_token';

// TODO: One day, we'll need to flesh out this object with the full Storage API
// Can't add a more specific type as the Storage type doesn't exist when building outside the browser.
const javascriptStorage: any = {};

const storage = () => {
  if (typeof localStorage === 'undefined') {
    return javascriptStorage;
  }
  if (RESTRICT_TO_SESSION) {
    return sessionStorage;
  }
  return localStorage;
};

export function getToken(): string | undefined {
  return storage()[LOCAL_STORAGE_AUTH_TOKEN_KEY];
}

export function saveToken(token: string | null): string {
  if (token) {
    storage()[LOCAL_STORAGE_AUTH_TOKEN_KEY] = token;
  }
  else {
    delete storage()[LOCAL_STORAGE_AUTH_TOKEN_KEY];
  }

  return token;
}

function versionKey(key: string) {
  return `moderator/${key}-version`;
}
function dataKey(key: string) {
  return `moderator/${key}-data`;
}

export function getStoreItem(key: string, version: number) {
  const versionToCheck = storage()[versionKey(key)];
  if (!versionToCheck || parseInt(versionToCheck, 10) !== version) {
    return null;
  }

  const data = storage()[dataKey(key)];
  if (!data) {
    return null;
  }

  return data;
}

export function saveStoreItem(key: string, version: number, data: string) {
  storage()[versionKey(key)] = version;
  storage()[dataKey(key)] = data;
}
