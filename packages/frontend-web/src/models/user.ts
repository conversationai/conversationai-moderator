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

import { ModelId } from './common';

export interface IUserAttributes {
  id?: ModelId;
  name: string;
  key?: string;
  email?: string;
  avatarURL?: string;
  group: string;
  isActive: boolean;
  extra?: any;
}

export type IUserModel = Readonly<IUserAttributes>;

export function UserModel(userAttributes: IUserAttributes): IUserModel {
  return userAttributes as IUserModel;
}
