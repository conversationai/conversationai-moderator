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
import { List, Map } from 'immutable';

import {
  SERVER_ACTION_ACCEPT,
  SERVER_ACTION_DEFER,
  SERVER_ACTION_HIGHLIGHT,
  SERVER_ACTION_REJECT,
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
  if (!val) {
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

function is_user(u: any) {
  if (!check.string(u)) {
    console.log('Bad user ID', u);
    return false;
  }
  if (!userIds.has(u)) {
    console.log('User check: no user with ID', u);
    console.log(' Known IDs', userIds);
    return false;
  }
  return true;
}

function is_user_or_null(u: any) {
  if (!u) {
    return true;
  }
  return is_user(u);
}

function array_of_users(val: any) {
  if (!check.array(val)) {
    return false;
  }

  let ret = true;
  for (const u of val) {
    ret = ret && is_user(u);
  }
  return ret;
}

function action(val: any) {
  if (!check.string(val)) {
    return false;
  }

  return [
    SERVER_ACTION_ACCEPT,
    SERVER_ACTION_REJECT,
    SERVER_ACTION_HIGHLIGHT,
    SERVER_ACTION_DEFER,
  ].indexOf(val) >= 0;
}

export function checkArrayOf(itemChecker: (i: any) => boolean, o: any) {
  if (!Array.isArray(o)) {
    console.log(`Thing is not an Array`);
    return false;
  }

  let valuesOk = true;
  for (const i of o) {
    valuesOk = itemChecker(i) && valuesOk;
  }
  return valuesOk;
}

function checkListNumber(o: any) {
  if (!List.isList(o)) {
    console.log(`Number list is not a list`);
    return false;
  }

  for (const n of o.toArray()) {
    if (!check.number(n)) {
      console.log(`Number list contains non number ${n}`);
      return false;
    }
  }
  return true;
}

function checkMap(o: any, type: string, keyType: (o: any) => boolean, valueType: (o: any) => boolean) {
  if (!Map.isMap(o)) {
    console.log(`Got a bad ${type}: Not a map`);
    return false;
  }

  for (const k of o.keys()) {
    if (!keyType(k)) {
      console.log(`Got a bad ${type}: key ${k} not a ${keyType.name}`);
      return false;
    }
    if (!valueType(o.get(k))) {
      console.log(`Got a bad ${type}: key ${k} has bad value: ${o.get(k)}: not a ${keyType.name}`);
      return false;
    }
  }
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
  categoryId: category_id_or_null,
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
  id: check.string,
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

// TODO: not all fields here
const commentFields = {
  id: check.string,
  sourceId: check.string,
  authorSourceId: check.string,
  text: check.string,
  isScored: check.boolean,
  isModerated: check.boolean,
  isAccepted: check.maybe.boolean,
  isDeferred: check.boolean,
  isHighlighted: check.boolean,
  isBatchResolved: check.boolean,
  isAutoResolved: check.boolean,
  unresolvedFlagsCount: check.number,
  flagsSummary: (o: any) => (!o || checkMap(o, 'comment:flagsSummary', check.string, checkListNumber)),
  };

const commentScoreFields = {
  id: check.string,
  commentId: check.string,
  tagId: check.string,
  score: check.number,
  sourceType: check.string,
};

const commentFlagFields = {
  id: check.string,
  commentId: check.string,
  label: check.string,
  detail: check.maybe.string,
  isRecommendation: check.boolean,
  sourceId: check.maybe.string,
  authorSourceId: check.maybe.string,
  isResolved: check.boolean,
  resolvedById: is_user_or_null,
  resolvedAt: date_string_or_null,
};

const moderatedCommentsFields = {
  approved: check.array.of.string,
  highlighted: check.array.of.string,
  rejected: check.array.of.string,
  deferred: check.array.of.string,
  flagged: check.array.of.string,
  batched: check.array.of.string,
  automated: check.array.of.string,
};

const histogramScoreFields = {
  score: check.number,
  commentId: check.string,
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

export function checkModeratedComments(o: any) {
  return checkObject(o, 'ModeratedComments', moderatedCommentsFields);
}

export function checkTextSizes(o: any) {
  return checkMap(o, 'textSizes', check.string, check.number);
}

function checkComment(o: any) {
  return checkObject(o, 'comment', commentFields);
}

export function checkListComments(o: any) {
  if (!List.isList(o)) {
    console.log(`Got a bad listComments: Not a list`);
    return false;
  }
  for (const c of o.toArray()) {
    if (!checkComment(c)) {
      return false;
    }
  }
  return true;
}

export function checkSingleComment(o: any) {
  checkComment(o.model);
}

export function checkCommentFlags(o: any) {
  if (!List.isList(o.models)) {
    console.log(`Got a bad commentFlags: Not a list`);
    return false;
  }
  for (const f of o.models.toArray()) {
    if (!checkObject(f, 'commentFlag', commentFlagFields)) {
      return false;
    }
  }
  return true;
}

export function checkCommentScores(o: any) {
  if (!List.isList(o.models)) {
    console.log(`Got a bad commentScores: Not a list`);
    return false;
  }
  for (const s of o.models.toArray()) {
    if (!checkObject(s, 'commentScore', commentScoreFields)) {
      return false;
    }
  }
  return true;
}

export function checkHistogramScores(o: any) {
  if (!List.isList(o)) {
    console.log(`Got a bad histogram scores: Not a list`);
    return false;
  }
  for (const s of o.toArray()) {
    if (!checkObject(s, 'commentScore', histogramScoreFields)) {
      return false;
    }
  }
  return true;
}
