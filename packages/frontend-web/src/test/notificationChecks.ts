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

import {
  IAllArticlesData,
  IArticleUpdate,
  IPerUserData,
  ISystemData,
} from '../app/platform/websocketService';
import { IArticleModel, ICategoryModel, IUserModel, ModelId } from '../models';
import {
  checkArticle,
  checkCategory,
  checkPreselect,
  checkRule,
  checkTag,
  checkTaggingSensitivity,
  checkUser,
} from './objectChecks';

class ArticleMessages {
  data: any = null;
  gotUpdate = false;

  countCategories = 0;
  categoriesOk = true;

  countArticles = 0;
  articlesOk = true;

  categories: Map<ModelId, ICategoryModel> = new Map();
  articlesWithNew: Array<IArticleModel> = [];
  articlesWithFlags: Array<IArticleModel> = [];
  articleFullyEnabled?: IArticleModel;
  articleWithNoModerators?: IArticleModel;

  updateHappened?(type: string, message: any): void;

  @autobind
  notificationHandler(data: IAllArticlesData) {
    console.log('+ Received all articles message');
    this.gotUpdate = true;

    this.countCategories = data.categories.size;
    this.countArticles = data.articles.size;
    this.data = data;
    if (this.updateHappened) {
      this.updateHappened('global', data);
    }
  }

  @autobind
  updateHandler(data: IArticleUpdate) {
    console.log('+ Received singe article update message');
    checkCategory(data.category);
    checkArticle(data.article);
    if (this.updateHappened) {
      this.updateHappened('article-update', data);
    }
  }

  dataCheck() {
    console.log('* check categories');
    for (const c of this.data.categories.toArray()) {
      this.categoriesOk = this.categoriesOk && checkCategory(c);
    }
    console.log('* check articles');
    for (const c of this.data.categories.toArray()) {
      this.categories.set(c.id, c);
    }
    for (const a of this.data.articles.toArray()) {
      this.articlesOk = this.articlesOk && checkArticle(a);
      if (a.unmoderatedCount > 0) {
        this.articlesWithNew.push(a);
      }
      if (a.flaggedCount > 0) {
        this.articlesWithFlags.push(a);
      }
      if (a.isCommentingEnabled && a.isAutoModerated) {
        this.articleFullyEnabled = a;
      }
      if (a.assignedModerators.length === 0) {
        this.articleWithNoModerators = a;
      }
    }
  }

  stateCheck() {
    if (!this.gotUpdate) {
      console.log('ERROR: Didn\'t get article update message');
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
  }
}

export const articleData = new ArticleMessages();

class SystemData {
  data: any = null;
  gotUpdate = false;

  usersOk = false;
  countUsers = 0;

  gotTags = false;
  gotTaggingSensitivities = false;
  gotRules = false;
  gotPreselects = false;

  users: Array<IUserModel> = [];

  @autobind
  notificationHandler(data: ISystemData) {
    console.log('+ Received system update message');
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
      this.users.push(u);
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

export const systemData = new SystemData();

class UserData {
  gotUpdate = false;
  gotAssigned = false;

  @autobind
  notificationHandler(data: IPerUserData) {
    console.log('+ Received user update message');
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

export const userData = new UserData();
