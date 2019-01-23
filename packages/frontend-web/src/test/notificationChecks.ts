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

import { IGlobalSummary, ISystemSummary, IUserSummary } from '../app/platform/websocketService';
import {
  checkArticle,
  checkCategory,
  checkPreselect,
  checkRule,
  checkTag,
  checkTaggingSensitivity,
  checkUser,
} from './objectChecks';

export const globalUpdate: any = {
  data: null,
  gotUpdate: false,

  usersOk: false,
  countUsers: 0,

  countCategories: 0,
  categoriesOk: true,

  countArticles: 0,
  articlesOk: true,

  gotDeferred: false,

  notificationHandler(data: IGlobalSummary) {
    console.log('Received global update message');
    globalUpdate.gotUpdate = true;
    globalUpdate.countUsers = data.users.size;
    globalUpdate.usersOk =  globalUpdate.countUsers > 0; // We assume there must be some users

    globalUpdate.countCategories = data.categories.size;
    globalUpdate.countArticles = data.articles.size;

    globalUpdate.gotDeferred = check.number(data.deferred);
    globalUpdate.data = data;
  },

  dataCheck() {
    console.log('* check users');
    for (const u of globalUpdate.data.users.toArray()) {
      globalUpdate.usersOk = globalUpdate.usersOk && checkUser(u);
    }
    console.log('* check categories');
    for (const c of globalUpdate.data.categories.toArray()) {
      globalUpdate.categoriesOk = globalUpdate.categoriesOk && checkCategory(c);
    }
    console.log('* check articles');
    for (const a of globalUpdate.data.articles.toArray()) {
      globalUpdate.articlesOk = globalUpdate.articlesOk && checkArticle(a);
    }
  },

  stateCheck() {
    console.log('* Results');
    if (!globalUpdate.gotUpdate) {
      console.log('ERROR: Didn\'t get global update message');
      return;
    }

    console.log(`Received ${globalUpdate.countUsers} users`);
    if (!globalUpdate.usersOk) {
      console.log('ERROR: Issue with users or no users fetched');
    }

    console.log(`Received ${globalUpdate.countCategories} categories`);
    if (!globalUpdate.categoriesOk) {
      console.log('ERROR: Issue with categories');
    }

    console.log(`Received ${globalUpdate.countArticles} articles`);
    if (!globalUpdate.articlesOk) {
      console.log('ERROR: Issue with articles');
    }

    if (!globalUpdate.gotDeferred) {
      console.log('ERROR: Didn\'t get deferred count');
    }
  },
};

export const systemUpdate: any = {
  data: null,
  gotUpdate: false,
  gotTags: false,
  gotTaggingSensitivities: false,
  gotRules: false,
  gotPreselects: false,

  notificationHandler(data: ISystemSummary) {
    console.log('Received system update message');
    systemUpdate.gotUpdate = true;
    systemUpdate.gotTags = data.tags.toArray().length > 0;
    systemUpdate.gotTaggingSensitivities = true;
    systemUpdate.gotRules = true;
    systemUpdate.gotPreselects = true;
    systemUpdate.data = data;
  },

  dataCheck() {
    for (const t of systemUpdate.data.tags.toArray()) {
      systemUpdate.gotTags = systemUpdate.gotTags && checkTag(t);
    }
    for (const t of systemUpdate.data.taggingSensitivities.toArray()) {
      systemUpdate.gotTaggingSensitivities = systemUpdate.gotTaggingSensitivities && checkTaggingSensitivity(t);
    }
    for (const r of systemUpdate.data.rules.toArray()) {
      systemUpdate.gotRules = systemUpdate.gotRules && checkRule(r);
    }
    for (const s of systemUpdate.data.preselects.toArray()) {
      systemUpdate.gotPreselects = systemUpdate.gotPreselects && checkPreselect(s);
    }
  },

  stateCheck() {
    if (!systemUpdate.gotUpdate) {
      console.log('ERROR: Didn\'t get system update message');
      return;
    }
    if (!systemUpdate.gotTags) {
      console.log('ERROR: Issue with tags or no tags fetched');
    }
    if (!systemUpdate.gotTaggingSensitivities) {
      console.log('ERROR: Issue with tagging sensitivities');
    }
    if (!systemUpdate.gotRules) {
      console.log('ERROR: Issue with rules');
    }
    if (!systemUpdate.gotPreselects) {
      console.log('ERROR: Issue with preselects');
    }
  },
};

export const userUpdate = {
  gotUpdate: false,
  gotAssigned: false,
  notificationHandler(data: IUserSummary) {
    console.log('Received user update message');
    userUpdate.gotUpdate = true;
    userUpdate.gotAssigned = check.number(data.assignments);
  },
  stateCheck() {
    if (!userUpdate.gotUpdate) {
      console.log('ERROR: Didn\'t get system update message');
      return;
    }
    if (!userUpdate.gotAssigned) {
      console.log('ERROR: Didn\'t get assigned count');
    }
  },
};
