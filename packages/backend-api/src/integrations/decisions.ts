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

import { Op } from 'sequelize';

import {
  Comment,
  Decision,
  User,
} from '../models';

export async function getDecisionForComment(
  comment: Comment,
): Promise<Decision | null> {
  return Decision.findOne({
    where: {
      commentId: comment.id,
      sentBackToPublisher: {  [Op.eq]: null },
      isCurrentDecision: true,
    },
  });
}

export async function foreachPendingDecision(
  owner: User,
  callback: (decision: Decision, comment: Comment) => Promise<void>,
) {
  const decisions = await Decision.findAll({
    where: {
      sentBackToPublisher: { [Op.eq]: null },
      isCurrentDecision: true,
    },
    include: [{model: Comment, required: true, where: {ownerId: owner.id}}],
  });

  for (const d of decisions) {
    await callback(d, (await d.getComment())!);
  }
}

export async function markDecisionExecuted(decision: Decision) {
  decision.sentBackToPublisher = new Date();
  await decision.save();
  const comment = (await decision.getComment())!;
  comment.sentBackToPublisher = new Date();
  await comment.save();
}
