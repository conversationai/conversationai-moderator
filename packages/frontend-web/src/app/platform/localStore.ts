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

import { RESTRICT_TO_SESSION } from '../config';

const LOCAL_STORAGE_TOKEN_KEY = 'moderator/auth_token';
const storage = () => RESTRICT_TO_SESSION ? sessionStorage : localStorage;

export function getToken(): string | undefined {
  return storage()[LOCAL_STORAGE_TOKEN_KEY];
}

export function saveToken(token: string): string {
  if (token) {
    storage()[LOCAL_STORAGE_TOKEN_KEY] = token;
  } else {
    delete storage()[LOCAL_STORAGE_TOKEN_KEY];
  }

  return token;
}
