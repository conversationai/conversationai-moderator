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

const RETURN_URL_PATH = 'moderator/return-url';

export interface IReturnURL {
  pathname: string;
  query?: {
    [key: string]: string;
  };
}

export function getReturnURL(): IReturnURL {
  const data = sessionStorage[RETURN_URL_PATH];

  if (data) {
    return JSON.parse(data);
  }
}

export function setReturnURL(data: IReturnURL): void {
  sessionStorage[RETURN_URL_PATH] = JSON.stringify(data);
}

export function clearReturnURL(): void {
  delete sessionStorage[RETURN_URL_PATH];
}
