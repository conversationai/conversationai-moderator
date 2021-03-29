/*
Copyright 2021 Google Inc.

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

import {ModerationRule, MODERATION_RULE_ACTION_TYPES_SET, Preselect, Tag, TaggingSensitivity} from '../models';
import {sendNotification} from '../notification_router';

export type ModelType = 'moderation_rule' | 'preselect' | 'tagging_sensitivity';

export function checkModelType(type: string): type is ModelType {
  switch (type) {
    case 'moderation_rule':
    case 'preselect':
    case 'tagging_sensitivity':
      return true;
  }
  return false;
}

export async function processRangeData(
  type: ModelType,
  data: {[key: string]: string | number | boolean | null},
  setValue: (key: string, value: string | number | boolean | null) => void,
): Promise<string | null> {
  for (const k of ['tagId', 'categoryId']) {
    if (k in data) {
      let val: number | null;
      if (data[k] === null) {
        if (k === 'tagId' && type === 'moderation_rule') {
          return 'tagId must be set.';
        }
        val = null;
      } else {
        val = parseInt(data[k] as string, 10);
        if (isNaN(val)) {
          return `Invalid value ${data[k]} for field ${k}.`;
        }
      }
      setValue(k, val);
    }
  }
  for (const k of ['lowerThreshold', 'upperThreshold']) {
    if (k in data) {
      const val = parseFloat(data[k] as string);
      if (isNaN(val) || val < 0 || val > 1) {
        return`Range error: ${k} is not a valid number: ${data[k]}.`;
      }
      setValue(k, val);
    }
  }
  if (type === 'moderation_rule') {
    if ('action' in data) {
      const action = data.action;
      if (!MODERATION_RULE_ACTION_TYPES_SET.has(action as string)) {
        return `Unknown action: ${action}.`;
      }

      setValue('action', action);
    }
  }

  return null;
}

export async function createRangeObject(
  type: ModelType,
  data: {[key: string]: string | number | boolean | null},
): Promise<string | null> {
  const modelData: {[key: string]: string | number | boolean | null } = {};

  const msg = await processRangeData(type, data, (key, value) => modelData[key] = value);
  if (msg) {
    return msg;
  }

  let mandatory_attributes = ['lowerThreshold', 'upperThreshold'];
  if (type === 'moderation_rule') {
    mandatory_attributes = [...mandatory_attributes, 'tagId', 'action'];
  }

  for (const k of mandatory_attributes) {
    if (!(k in modelData)) {
      return `Missing mandatory attribute: ${k}.`;
    }
  }

  switch (type) {
    case 'moderation_rule':
      await ModerationRule.create(data as any);
      break;
    case 'preselect':
      await Preselect.create(data as any);
      break;
    case 'tagging_sensitivity':
      await TaggingSensitivity.create(data as any);
      break;
  }

  sendNotification('global');
  return null;
}

export async function modifyRangeObject(
  type: ModelType,
  id: number,
  data: {[key: string]: string | number | boolean | null},
): Promise<string | null> {
  let object: ModerationRule | Preselect | TaggingSensitivity | null;
  switch (type) {
    case 'moderation_rule':
      object = await ModerationRule.findByPk(id);
      break;
    case 'preselect':
      object = await Preselect.findByPk(id);
      break;
    case 'tagging_sensitivity':
      object = await TaggingSensitivity.findByPk(id);
      break;
  }

  if (!object) {
    return 'Not found';
  }

  const msg = await processRangeData(type, data, (key, value) => object!.set(key as any, value as any));
  if (msg) {
    return msg;
  }

  await object.save();
  sendNotification('global');
  return null;
}

export async function deleteRangeObject(type: ModelType | 'tag', objectId: number ) {
  switch (type) {
    case 'moderation_rule':
      await ModerationRule.destroy({where: {id: objectId}});
      break;
    case 'preselect':
      await Preselect.destroy({where: {id: objectId}});
      break;
    case 'tagging_sensitivity':
      await TaggingSensitivity.destroy({where: {id: objectId}});
      break;
    case 'tag':
      await Tag.destroy({where: {id: objectId}});
      break;
  }
  sendNotification('global');
}

export async function createTagObject(
  data: {[key: string]: string | number | boolean | null},
): Promise<string | null> {
  for (const k of ['color', 'key', 'label']) {
    if (typeof data[k] !== 'string') {
      return `Tag creation error: Missing/invalid attribute ${k}.`;
    }
  }

  const {color, description, key, label, isInBatchView, inSummaryScore, isTaggable} = data;

  await Tag.create({
    color, description, key, label,
    isInBatchView: !!isInBatchView,
    inSummaryScore: !!inSummaryScore,
    isTaggable: !!isTaggable,
  });

  sendNotification('global');
  return null;
}

export async function modifyTagObject(
  id: number,
  data: {[key: string]: string | number | boolean | null},
): Promise<string | null> {
  const tag = await Tag.findByPk(id);
  if (!tag) {
    return 'Not found';
  }

  for (const k of ['color', 'key', 'label', 'description']) {
    if (k in data) {
      if (typeof data[k] !== 'string' && (k !== 'description' || data[k] !== null)) {
        return `Tag modification error: Invalid attribute ${k}.`;
      }
      tag.set(k as 'color' | 'key' | 'label' | 'description', data[k] as string);
    }
  }

  for (const k of ['isInBatchView', 'inSummaryScore', 'isTaggable']) {
    if (k in data) {
      tag.set(k as 'isInBatchView' | 'inSummaryScore' | 'isTaggable', !!data[k]);
    }
  }

  await tag.save();
  sendNotification('global');
  return null;
}
