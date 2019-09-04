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

import { Comment, Decision } from '@conversationai/moderator-backend-core';
import {
  ICommentInstance,
  IDecisionInstance,
  IUserInstance,
} from '@conversationai/moderator-backend-core';
import { sequelize } from '@conversationai/moderator-backend-core';

export async function getDecisionForComment(
  comment: ICommentInstance,
): Promise<IDecisionInstance> {
  return await Decision.findOne({
    where: {
      commentId: comment.id,
      sentBackToPublisher: null,
      isCurrentDecision: true,
    } as any,
  });
}

export async function foreachPendingDecision(
  owner: IUserInstance,
  callback: (decision: IDecisionInstance, comment: ICommentInstance) => Promise<void>,
) {
  const decisions = await Decision.findAll({
    where: {
      sentBackToPublisher: null,
      isCurrentDecision: true,
    } as any,
    include: [{model: Comment, required: true, where: {ownerId: owner.id}}],
  });

  for (const d of decisions) {
    await callback(d, await d.getComment());
  }
}

export async function markDecisionExecuted(decision: IDecisionInstance) {
  decision.set('sentBackToPublisher', sequelize.fn('now')).save();
  const comment = (await decision.getComment())!;
  comment.set('sentBackToPublisher', sequelize.fn('now')).save();
}
