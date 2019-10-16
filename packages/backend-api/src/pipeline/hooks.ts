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

import { Comment, ICommentInstance, IUserInstance, User } from '../models';
import { enqueue, registerTask } from '../processing/util';

export interface IPipelineHook {
  commentModerated(owner: IUserInstance, comment: ICommentInstance): Promise<void>;
}

const hooks = new Map<string, IPipelineHook>();

export interface IHookData {
  ownerId: number;
  [key: string]: number | string;
}

async function getOwnerData(ownerId: number) {
  const owner = await User.findById(ownerId);
  const ownerType = owner.get('group');
  const hook = hooks.get(ownerType);
  return {owner, ownerType, hook};
}

async function executeCommentModeratedTask(data: IHookData) {
  const { owner, hook } = await getOwnerData(data.ownerId);
  if (hook && hook.commentModerated) {
    const comment = await Comment.findById(data['commentId']);
    await hook.commentModerated(owner, comment);
  }
}

export function registerHooks(ownerType: string, hook: IPipelineHook) {
  hooks.set(ownerType, hook);
  registerTask<IHookData>(`${ownerType}:commentModerated`, executeCommentModeratedTask);
}

export async function commentModeratedHook(comment: ICommentInstance) {
  const ownerId = comment.get('ownerId');
  if (!ownerId) {
    return;
  }
  const { owner, ownerType, hook } = await getOwnerData(ownerId);
  if (hook && hook.commentModerated) {
    await enqueue<IHookData>(`${ownerType}:commentModerated`, {ownerId: owner.id, commentId: comment.id});
  }
}
