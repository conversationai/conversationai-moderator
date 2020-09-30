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

import { List } from 'immutable';
import { isEqual } from 'lodash';
import slugify from 'slugify';

import {
  IPreselectModel,
  IRuleModel,
  ITaggingSensitivityModel,
  ITagModel,
  IUserModel,
  ModelId,
} from '../../../models';
import {
  createModel,
  createTag,
  createUser,
  destroyModel,
  updateModel,
  updateTag,
  updateUser,
} from '../../platform/dataService';

function diff<T extends {id: ModelId}>(original: List<T>, current: List<T>): {
  modified: Array<T>,
  added: Array<T>,
  removed: Array<ModelId>,
} {
  const originals = new Map<ModelId, T>();
  const toAdd: Array<T> = [];
  const toModify: Array<T> = [];
  for (const o of original.toArray()) {
    originals.set(o.id, o);
  }
  for (const c of current.toArray()) {
    if (originals.has(c.id)) {
      if (!isEqual(originals.get(c.id), c)) {
        toModify.push(c);
      }
      originals.delete(c.id);
    } else {
      toAdd.push(c);
    }
  }

  return { modified: toModify, added: toAdd, removed: Array.from(originals.keys()) };
}

export async function addUser(user: IUserModel): Promise<void> {
  await createUser(user);
}

export async function modifyUser(user: IUserModel): Promise<void> {
 await updateUser(user);
}

async function addTag(tag: ITagModel): Promise<void> {
  await createTag({
    ...tag,
    key: slugify(tag.label, '_').toUpperCase(),
  });
}

async function modifyTag(tag: ITagModel): Promise<void> {
  await updateTag(tag);
}

async function deleteTag(tagId: ModelId): Promise<void> {
  await destroyModel('tag', tagId);
}

export async function updateTags(oldTags: List<ITagModel>, newTags: List<ITagModel>) {
  const { modified, added, removed } = diff<ITagModel>(oldTags, newTags);
  await Promise.all([
    Promise.all(modified.map(modifyTag)),
    Promise.all(added.map(addTag)),
    Promise.all(removed.map(deleteTag)),
  ]);
}

async function addRule(rule: IRuleModel): Promise<void> {
  await createModel('moderation_rules', rule);
}

async function modifyRule(rule: IRuleModel): Promise<void> {
  await updateModel('moderation_rules', rule);
}

async function deleteRule(ruleId: ModelId): Promise<void> {
  await destroyModel('moderation_rules', ruleId);
}

export async function updateRules(oldRules: List<IRuleModel>, newRules: List<IRuleModel>) {
  const { modified, added, removed } = diff<IRuleModel>(oldRules, newRules);
  await Promise.all([
    Promise.all(modified.map(modifyRule)),
    Promise.all(added.map(addRule)),
    Promise.all(removed.map(deleteRule)),
  ]);
}

async function addPreselect(preselect: IPreselectModel): Promise<void> {
  await createModel('preselects', preselect);
}

async function modifyPreselect(preselect: IPreselectModel): Promise<void> {
  await updateModel('preselects', preselect);
}

async function deletePreselect(preselectId: ModelId): Promise<void> {
  await destroyModel('preselects', preselectId);
}

export async function updatePreselects(oldPreselects: List<IPreselectModel>, newPreselects: List<IPreselectModel>) {
  const { modified, added, removed } = diff<IPreselectModel>(oldPreselects, newPreselects);
  await Promise.all([
    Promise.all(modified.map(modifyPreselect)),
    Promise.all(added.map(addPreselect)),
    Promise.all(removed.map(deletePreselect)),
  ]);
}

async function addTaggingSensitivity(taggingSensitivity: ITaggingSensitivityModel): Promise<void> {
  await createModel('tagging_sensitivities', taggingSensitivity);
}

async function modifyTaggingSensitivity(taggingSensitivity: ITaggingSensitivityModel): Promise<void> {
  await updateModel('tagging_sensitivities', taggingSensitivity);
}

async function deleteTaggingSensitivity(taggingSensitivityId: ModelId): Promise<void> {
  await destroyModel('tagging_sensitivities', taggingSensitivityId);
}

export async function updateTaggingSensitivities(oldRules: List<ITaggingSensitivityModel>, newRules: List<ITaggingSensitivityModel>) {
  const { modified, added, removed } = diff<ITaggingSensitivityModel>(oldRules, newRules);
  await Promise.all([
    Promise.all(modified.map(modifyTaggingSensitivity)),
    Promise.all(added.map(addTaggingSensitivity)),
    Promise.all(removed.map(deleteTaggingSensitivity)),
  ]);
}
