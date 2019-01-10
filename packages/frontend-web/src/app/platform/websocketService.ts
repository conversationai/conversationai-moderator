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

import {List} from 'immutable';

import {
  IArticleModel,
  ICategoryModel,
  IPreselectModel,
  IRuleModel,
  ITaggingSensitivityModel,
  ITagModel,
  IUserModel,
} from '../../models';
import {
  ArticleModel,
  CategoryModel,
  PreselectModel,
  RuleModel,
  TaggingSensitivityModel,
  TagModel,
  UserModel,
} from '../../models';
import { serviceURL } from './dataService';
import { getToken } from './localStore';

// TODO: Is it possible to nail down the types of this object?
// The WebSocket type is subtly different between browser and non-browser implementation, which makes this difficult.
let myws: any;

if (typeof(WebSocket) === 'undefined') {
  myws = require('ws');
}
else {
  myws = WebSocket;
}

let ws: WebSocket = null;
let intervalTimer: NodeJS.Timer;

export const STATUS_DOWN = 'down';
export const STATUS_UP = 'up';
export const STATUS_RESET = 'reset';

export interface ISystemSummary {
  tags: List<ITagModel>;
  taggingSensitivities: List<ITaggingSensitivityModel>;
  rules: List<IRuleModel>;
  preselects: List<IPreselectModel>;
}

export interface IGlobalSummary {
  users: List<IUserModel>;
  categories: List<ICategoryModel>;
  articles: List<IArticleModel>;
  deferred: number;
}

export interface IUserSummary {
  assignments: number;
}

// TODO: Ideally we'd have a type file describing types sent over the wire.
//       When this is availabe, replace the "any" types in the code below.
// TODO: API sending number IDs, but we expect strings due to the way the old REST code works.
//       Convert for now.  But at some point need to refactor to use numbers.
function packSystemData(data: any): ISystemSummary {
  return {
    tags: List<ITagModel>(data.tags.map((t: any) => {
      t.id = t.id.toString();
      return TagModel(t);
    })),
    taggingSensitivities: List<ITaggingSensitivityModel>(data.taggingSensitivities.map((t: any) => {
      return TaggingSensitivityModel(t);
    })),
    rules: List<IRuleModel>(data.rules.map((r: any) => {
      return RuleModel(r);
    })),
    preselects: List<IPreselectModel>(data.preselects.map((p: any) => {
      return PreselectModel(p);
    })),
  };
}

function packGlobalData(data: any): IGlobalSummary {
  const userMap: {[key: number]: IUserModel} = {};
  const catMap: {[key: number]: ICategoryModel} = {};

  const users = List<IUserModel>(data.users.map((u: any) => {
    const id = u.id;
    u.id = u.id.toString();
    userMap[id] = u;
    return UserModel(u);
  }));

  const categories = List<ICategoryModel>(data.categories.map((c: any) => {
    const id = c.id;
    c.id = c.id.toString();
    c.assignedModerators = c.assignedModerators.map((i: any) => userMap[i.user_category_assignment.userId]);
    const model = CategoryModel(c);
    catMap[id] = model;
    return model;
  }));

  const articles = List<IArticleModel>(data.articles.map((a: any) => {
    a.id = a.id.toString();
    if (a.categoryId) {
      a.category = catMap[a.categoryId];
    }
    a.assignedModerators = a.assignedModerators.map((i: any) => userMap[i.moderator_assignment.userId]);
    return ArticleModel(a);
  }));

  return {
    users: users,

    categories: categories,

    articles: articles,

    deferred: data.deferred,
  };
}

let gotSystem = false;
let gotGlobal = false;
let gotUser = false;
let socketUp = false;

export function connectNotifier(
  websocketStateHandler: (status: string) => void,
  systemNotificationHandler: (data: ISystemSummary) => void,
  globalNotificationHandler: (data: IGlobalSummary) => void,
  userNotificationHandler: (data: IUserSummary) => void) {
  function checkSocketAlive() {
    if (!ws || ws.readyState !== myws.OPEN) {
      const token = getToken();
      const baseurl = serviceURL(`updates/summary/?token=${token}`);
      const url = 'ws:' + baseurl.substr(baseurl.indexOf(':') + 1);

      ws = new myws(url);
      ws.onopen = () => {
        console.log('opened websocket');

        ws.onclose = (e: {code: number}) => {
          console.log('websocket closed', e.code);
          socketUp = false;
          if (!gotSystem && !gotGlobal && !gotUser) {
            // Never got a message.  Server is rejecting our advances.  Log out and try logging in again.
            websocketStateHandler(STATUS_RESET);
          }
          else {
            websocketStateHandler(STATUS_DOWN);
          }
          ws = null;
        };
      };

      ws.onmessage = (message: {data: string}) => {
        const body: any = JSON.parse(message.data);

        if (body.type === 'system') {
          systemNotificationHandler(packSystemData(body.data));
          gotSystem = true;
        }
        else if (body.type === 'global') {
          globalNotificationHandler(packGlobalData(body.data));
          gotGlobal = true;
        }
        else if (body.type === 'user') {
          userNotificationHandler(body.data as IUserSummary);
          gotUser = true;
        }

        if (gotSystem && gotGlobal && gotUser && !socketUp) {
          websocketStateHandler(STATUS_UP);
          socketUp = true;
        }
      };
    }
  }

  checkSocketAlive();
  intervalTimer = setInterval(checkSocketAlive, 10000);
}

export function disconnectNotifier() {
  clearInterval(intervalTimer);
  ws.close();
}
