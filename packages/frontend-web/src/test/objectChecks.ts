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

import check from 'check-types';
import {
  RULE_ACTION_ACCEPT,
  RULE_ACTION_DEFER,
  RULE_ACTION_HIGHLIGHT,
  RULE_ACTION_REJECT,
} from '../models';

const loggedBad: any = {};

function date_string(val: any) {
  if (!check.string(val)) {
    return false;
  }

  const t = Date.parse(val);
  return !Number.isNaN(t);
}

function date_string_or_null(val: any) {
  if (val === null) {
    return true;
  }
  return date_string(val);
}

const email_re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
function email(val: any) {
  if (!check.string(val)) {
    return false;
  }
  return email_re.test(val);
}

function url(val: any) {
  if (!check.string(val)) {
    return false;
  }

  // TODO: URL RE
  return true;
}

function url_or_null(val: any) {
  if (val === null) {
    return true;
  }
  return url(val);
}

function moderator_group(val: any) {
  return val === 'admin' || val === 'general';
}

const categoryIds = new Set();
const tagIds = new Set();
const userIds = new Set();

function category(val: any) {
  if (!check.object(val as any)) {
    return false;
  }
  if (!val.id) {
    console.log(`invalid category: ${val}`);
    return false;
  }
  if (!categoryIds.has(val.id)) {
    console.log(`invalid category: ${val.id}`);
    return false;
  }
}

function category_id_or_null(val: any) {
  if (val === null) {
    return true;
  }

  // TODO: Don't like this inconsistency between categoryIds.  We really need to pin down ids into a single type.
  return categoryIds.has(val.toString());
}

function tag_id_or_null(val: any) {
  if (val === null) {
    return true;
  }

  // TODO: Don't like this inconsistency between tagids.  We really need to pin down ids into a single type.
  return tagIds.has(val.toString());
}

function array_of_users(val: any) {
  if (!check.array(val)) {
    return false;
  }

  let ret = true;
  for (const u of val) {
    if (!check.string(u)) {
      console.log(`Bad user ID ${u}`);
      ret = false;
    }
    if (!userIds.has(u)) {
      console.log(`User check: no user with ID ${u}`);
      console.log(` Known IDs ${userIds}`);
      ret = false;
    }
  }
  return ret;
}

function action(val: any) {
  if (!check.string(val)) {
    return false;
  }

  return [
    RULE_ACTION_ACCEPT,
    RULE_ACTION_REJECT,
    RULE_ACTION_HIGHLIGHT,
    RULE_ACTION_DEFER,
  ].indexOf(val) >= 0;
}

// These attribute lists should duplicate those in updateNotifications.ts.
const commonFields = {
  id: check.string,
  updatedAt: date_string,
  allCount: check.number,
  unprocessedCount: check.number,
  unmoderatedCount: check.number,
  moderatedCount: check.number,
  approvedCount: check.number,
  highlightedCount: check.number,
  rejectedCount: check.number,
  deferredCount: check.number,
  flaggedCount: check.number,
  batchedCount: check.number,
  recommendedCount: check.number,
  assignedModerators: array_of_users,
};

const categoryFields = {
  ...commonFields,
  label: check.string,
};

const articleFields = {
  ...commonFields,
  title: check.string,
  url: check.string,
  category: category,
  sourceCreatedAt: date_string,
  lastModeratedAt: date_string_or_null,
  isCommentingEnabled: check.boolean,
  isAutoModerated: check.boolean,
};

const userFields = {
  id: check.string,
  name: check.string,
  email: email,
  avatarURL: url_or_null,
  group: moderator_group,
  isActive: check.boolean,
};

const tagFields = {
  id: check.string,
  color: check.string,
  description: check.maybe.string,
  key: check.string,
  label: check.string,
  isInBatchView: check.boolean,
  inSummaryScore: check.boolean,
  isTaggable: check.boolean,
};

const rangeFields = {
  id: check.number,
  categoryId: category_id_or_null,
  lowerThreshold: check.number,
  upperThreshold: check.number,
  tagId: tag_id_or_null,
};

const ruleFields = {
  ...rangeFields,
  action: action,
  createdBy: check.maybe.string,
};

function checkObject(o: any, type: string, fields: any): boolean {
  const res = check.map(o, fields);
  if (check.all(res)) {
    return true;
  }

  console.log(`Got a bad ${type}: ${o.id}`);

  if (loggedBad[type]) {
    return false;
  }

  for (const k in res) {
    if (!res.hasOwnProperty(k)) {
      continue;
    }
    if (!res[k]) {
      console.log(` ${k}: ${o[k]} (expecting ${fields[k].name} got ${typeof(o[k])})`);
    }
  }
  loggedBad[type] = true;
  return false;
}

export function checkCategory(o: any) {
  if (!checkObject(o, 'category', categoryFields)) {
    return false;
  }

  categoryIds.add(o.id);
  return true;
}

export function checkArticle(o: any) {
  return checkObject(o, 'article', articleFields);
}

export function checkUser(o: any) {
  if (!checkObject(o, 'user', userFields)) {
    return false;
  }

  userIds.add(o.id);
  return true;
}

export function checkTag(o: any) {
  if (!checkObject(o, 'tag', tagFields)) {
    return false;
  }
  tagIds.add(o.id);
  return true;
}

export function checkTaggingSensitivity(o: any) {
  return checkObject(o, 'taggingSensitivity', rangeFields);
}

export function checkRule(o: any) {
  return checkObject(o, 'rule', ruleFields);
}

export function checkPreselect(o: any) {
  return checkObject(o, 'preselect', rangeFields);
}
