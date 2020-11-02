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

import * as express from 'express';

import { youtubeActivateChannel, youtubeSynchronizeChannel } from '../../integrations';
import {
  Category,
  User,
  USER_GROUP_YOUTUBE,
} from '../../models';
import { enqueue, registerTask } from '../../processing/util';
import { REPLY_SUCCESS } from '../constants';

/**
 * API endpoints to control comment sources.
 */

const ACTION_ACTIVATE = 'activate';
const ACTION_SYNC = 'sync';

export interface ISynchronizeChannelData {
  ownerId: number;
  channelId: number;
}

async function _youtubeSynchronizeChannel(
  owner: User,
  channel: Category,
) {
  await enqueue<ISynchronizeChannelData>('youtubeSynchronizeChannel', {ownerId: owner.id, channelId: channel.id});
}

registerTask<ISynchronizeChannelData>('youtubeSynchronizeChannel', async (data: ISynchronizeChannelData) => {
  const owner = await User.findByPk(data.ownerId);
  const channel = await Category.findByPk(data.channelId);
  if (!owner) {
    throw new Error(`Youtube Sync failed: Owner ${data.ownerId} does not exist`);
  }
  if (!channel) {
    throw new Error(`Youtube Sync failed: Channel ${data.channelId} does not exist`);
  }

  await youtubeSynchronizeChannel(owner, channel);
});

const ACTIONS = new Map([
  [ACTION_ACTIVATE,  new Map([[USER_GROUP_YOUTUBE, youtubeActivateChannel]])],
  [ACTION_SYNC, new Map([[USER_GROUP_YOUTUBE, _youtubeSynchronizeChannel]])],
]);

function createAction(actionId: string): express.RequestHandler {
  return async (req, res, next) => {
    const category = await Category.findOne({where: {id: req.params.categoryId}});
    if (!category) {
      res.status(400).json({error: 'No such category'});
      next();
      return;
    }

    const owner = await category.getOwner();
    if (!owner) {
      res.status(400).json({error: 'Category has no owner'});
      next();
      return;
    }

    const action = ACTIONS.get(actionId)!.get(owner.group);
    if (!action) {
      res.status(400).json({error: `Category does not support action ${action}`});
      next();
      return;
    }

    try {
      await action(owner, category, req.body.data);
    }
    catch (e) {
      res.status(400).json({error: `Something went wrong: ${e}`});
      next();
      return;
    }
    res.json(REPLY_SUCCESS);
    next();
  };
}

export function createCommentSourcesService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.post('/activate/:categoryId', createAction(ACTION_ACTIVATE));
  router.get('/sync/:categoryId', createAction(ACTION_SYNC));
  return router;
}
