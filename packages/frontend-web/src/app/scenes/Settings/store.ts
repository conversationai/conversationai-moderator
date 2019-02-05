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

import { List, Map } from 'immutable';
import slugify from 'slugify';

import {
  IPreselectModel,
  IRuleModel,
  ITaggingSensitivityModel,
  ITagModel,
  IUserModel,
 } from '../../../models';
import {
  createModel,
  destroyModel,
  updateModel,
} from '../../platform/dataService';
import { IThunkAction } from '../../stores';
import {
  USER_GROUP_ADMIN,
  USER_GROUP_GENERAL,
  USER_GROUP_SERVICE,
} from '../../stores/users';

function diff<T extends Map<string, any>>(original: List<T>, current: List<T>): {
  modified: List<T>,
  added: List<T>,
  removed: List<T>,
} {
  const modifiedOrAdded = current.filter((item) =>
      !item.equals( original.find((originalItem) => originalItem.get('id') === item.get('id')) ));
  const modified = modifiedOrAdded.filter((item) =>
      !!original.find((originalItem) => originalItem.get('id') === item.get('id')));
  const added = modifiedOrAdded.filter((item) =>
      !original.find((originalItem) => originalItem.get('id') === item.get('id')));
  const removed = original.filter((item) =>
      !current.find((currentItem) => currentItem.get('id') === item.get('id')));

  return { modified: modified as List<T>, added: added as List<T>, removed: removed as List<T> };
}

export async function addUser(user: IUserModel): Promise<void> {
  await createModel<IUserModel>(
    'users',
    user.set('key', slugify(user.get('name'), '_').toUpperCase()) as any,
  );
}

// TODO: the typing in this module looks wrong - note the many casts to 'any' when calling createModel, updateModel etc.
//  But it works. Which leads me to suspect the interface defined by these functions does not match the actual
//  interface used by the generic JSON API...

export async function modifyUser(user: IUserModel): Promise<void> {
  // Strip out the extra field for most categories of user
  if (user.group === USER_GROUP_GENERAL || user.group === USER_GROUP_ADMIN || user.group === USER_GROUP_SERVICE) {
    user = user.delete('extra');
  }

  await updateModel<IUserModel>(
    'users',
    user.id,
    user as any,
  );
}

async function addTag(tag: ITagModel): Promise<void> {
  await createModel<ITagModel>(
    'tags',
    tag.set('key', slugify(tag.get('label'), '_').toUpperCase()) as any,
  );
}

async function modifyTag(tag: ITagModel): Promise<void> {
  await updateModel<ITagModel>(
    'tags',
    tag.id,
    tag as any,
  );
}

async function deleteTag(tag: ITagModel): Promise<void> {
  await destroyModel(
    'tags',
    tag.id,
  );
}

export function updateTags(oldTags: List<ITagModel>, newTags: List<ITagModel>): IThunkAction<void> {
  return async (): Promise<void> => {
    const { modified, added, removed } = diff<ITagModel>(oldTags, newTags);
    await Promise.all([
      Promise.all(modified.map(modifyTag).toArray()),
      Promise.all(added.map(addTag).toArray()),
      Promise.all(removed.map(deleteTag).toArray()),
    ]);
  };
}

async function addRule(rule: IRuleModel): Promise<void> {
  await createModel<IRuleModel>(
    'moderation_rules',
    rule as any,
  );
}

async function modifyRule(rule: IRuleModel): Promise<void> {
  await updateModel<IRuleModel>(
    'moderation_rules',
    rule.id,
    rule as any,
  );
}

async function deleteRule(rule: IRuleModel): Promise<void> {
  await destroyModel(
    'moderation_rules',
    rule.id,
  );
}

export function updateRules(oldRules: List<IRuleModel>, newRules: List<IRuleModel>): IThunkAction<void> {
  return async (): Promise<void> => {
    const { modified, added, removed } = diff<IRuleModel>(oldRules, newRules);
    await Promise.all([
      Promise.all(modified.map(modifyRule).toArray()),
      Promise.all(added.map(addRule).toArray()),
      Promise.all(removed.map(deleteRule).toArray()),
    ]);
  };
}

async function addPreselect(preselect: IPreselectModel): Promise<void> {
  await createModel<IPreselectModel>(
    'preselects',
    preselect as any,
  );
}

async function modifyPreselect(preselect: IPreselectModel): Promise<void> {
  await updateModel<IPreselectModel>(
    'preselects',
    preselect.id,
    preselect as any,
  );
}

async function deletePreselect(preselect: IPreselectModel): Promise<void> {
  await destroyModel(
    'preselects',
    preselect.id,
  );
}

export function updatePreselects(oldPreselects: List<IPreselectModel>, newPreselects: List<IPreselectModel>): IThunkAction<void> {
  return async (): Promise<void> => {
    const { modified, added, removed } = diff<IPreselectModel>(oldPreselects, newPreselects);
    await Promise.all([
      Promise.all(modified.map(modifyPreselect).toArray()),
      Promise.all(added.map(addPreselect).toArray()),
      Promise.all(removed.map(deletePreselect).toArray()),
    ]);
  };
}

async function addTaggingSensitivity(taggingSensitivity: ITaggingSensitivityModel): Promise<void> {
  await createModel<ITaggingSensitivityModel>(
    'tagging_sensitivities',
    taggingSensitivity as any,
  );
}

async function modifyTaggingSensitivity(taggingSensitivity: ITaggingSensitivityModel): Promise<void> {
  await updateModel<ITaggingSensitivityModel>(
    'tagging_sensitivities',
    taggingSensitivity.id,
    taggingSensitivity as any,
  );
}

async function deleteTaggingSensitivity(taggingSensitivity: ITaggingSensitivityModel): Promise<void> {
  await destroyModel(
    'tagging_sensitivities',
    taggingSensitivity.id,
  );
}

export function updateTaggingSensitivities(oldRules: List<ITaggingSensitivityModel>, newRules: List<ITaggingSensitivityModel>): IThunkAction<void> {
  return async (): Promise<void> => {
    const { modified, added, removed } = diff<ITaggingSensitivityModel>(oldRules, newRules);
    await Promise.all([
      Promise.all(modified.map(modifyTaggingSensitivity).toArray()),
      Promise.all(added.map(addTaggingSensitivity).toArray()),
      Promise.all(removed.map(deleteTaggingSensitivity).toArray()),
    ]);
  };
}
