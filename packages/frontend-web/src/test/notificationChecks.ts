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
import { autobind } from 'core-decorators';

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
import {IArticleModel} from '../models';

class GlobalUpdate {
  data: any = null;
  gotUpdate = false;

  countCategories = 0;
  categoriesOk = true;

  countArticles = 0;
  articlesOk = true;

  gotDeferred = false;

  articlesWithFlags: Array<IArticleModel> = [];

  @autobind
  notificationHandler(data: IGlobalSummary) {
    console.log('  Received global update message');
    this.gotUpdate = true;

    this.countCategories = data.categories.size;
    this.countArticles = data.articles.size;

    this.gotDeferred = check.number(data.deferred);
    this.data = data;
  }

  dataCheck() {
    console.log('* check categories');
    for (const c of this.data.categories.toArray()) {
      this.categoriesOk = this.categoriesOk && checkCategory(c);
    }
    console.log('* check articles');
    for (const a of this.data.articles.toArray()) {
      this.articlesOk = this.articlesOk && checkArticle(a);
      if (a.flaggedCount > 0) {
        this.articlesWithFlags.push(a);
      }
    }
  }

  stateCheck() {
    if (!this.gotUpdate) {
      console.log('ERROR: Didn\'t get global update message');
      return;
    }

    console.log(`  Received ${this.countCategories} categories`);
    if (!this.categoriesOk) {
      console.log('ERROR: Issue with categories');
    }

    console.log(`  Received ${this.countArticles} articles: ${this.articlesWithFlags.length} with flagged comments`);
    if (!this.articlesOk) {
      console.log('ERROR: Issue with articles');
    }

    if (!this.gotDeferred) {
      console.log('ERROR: Didn\'t get deferred count');
    }
  }
}

export const globalUpdate = new GlobalUpdate();

class SystemUpdate {
  data: any = null;
  gotUpdate = false;

  usersOk = false;
  countUsers = 0;

  gotTags = false;
  gotTaggingSensitivities = false;
  gotRules = false;
  gotPreselects = false;

  @autobind
  notificationHandler(data: ISystemSummary) {
    console.log('  Received system update message');
    this.gotUpdate = true;
    this.countUsers = data.users.size;
    this.usersOk =  this.countUsers > 0; // We assume there must be some users
    this.gotTags = data.tags.toArray().length > 0;
    this.gotTaggingSensitivities = true;
    this.gotRules = true;
    this.gotPreselects = true;
    this.data = data;
  }

  usersCheck() {
    console.log('* check users');
    for (const u of this.data.users.toArray()) {
      this.usersOk = this.usersOk && checkUser(u);
    }
  }

  tagsCheck() {
    console.log('* check tags');
    for (const t of this.data.tags.toArray()) {
      this.gotTags = this.gotTags && checkTag(t);
    }
    for (const t of this.data.taggingSensitivities.toArray()) {
      this.gotTaggingSensitivities = this.gotTaggingSensitivities && checkTaggingSensitivity(t);
    }
    for (const r of this.data.rules.toArray()) {
      this.gotRules = this.gotRules && checkRule(r);
    }
    for (const s of this.data.preselects.toArray()) {
      this.gotPreselects = this.gotPreselects && checkPreselect(s);
    }
  }

  stateCheck() {
    if (!this.gotUpdate) {
      console.log('ERROR: Didn\'t get system update message');
      return;
    }

    console.log(`  Received ${this.countUsers} users`);
    if (!this.usersOk) {
      console.log('ERROR: Issue with users or no users fetched');
    }

    if (!this.gotTags) {
      console.log('ERROR: Issue with tags or no tags fetched');
    }
    if (!this.gotTaggingSensitivities) {
      console.log('ERROR: Issue with tagging sensitivities');
    }
    if (!this.gotRules) {
      console.log('ERROR: Issue with rules');
    }
    if (!this.gotPreselects) {
      console.log('ERROR: Issue with preselects');
    }
  }
}

export const systemUpdate = new SystemUpdate();

class UserUpdate {
  gotUpdate = false;
  gotAssigned = false;

  @autobind
  notificationHandler(data: IUserSummary) {
    console.log('  Received user update message');
    this.gotUpdate = true;
    this.gotAssigned = check.number(data.assignments);
  }

  stateCheck() {
    if (!this.gotUpdate) {
      console.log('ERROR: Didn\'t get system update message');
      return;
    }
    if (!this.gotAssigned) {
      console.log('ERROR: Didn\'t get assigned count');
    }
  }
}

export const userUpdate = new UserUpdate();
