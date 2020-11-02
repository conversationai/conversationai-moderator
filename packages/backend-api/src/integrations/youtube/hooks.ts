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

import { Comment, User } from '../../models';
import { IPipelineHook } from '../../pipeline/hooks';
import { getDecisionForComment } from '../decisions';
import { for_one_youtube_user } from './authenticate';
import { implement_moderation_decision } from './comments';

export const youtubeHooks: IPipelineHook = {
  async commentModerated(owner: User, comment: Comment) {
    await for_one_youtube_user(owner, async (_, auth) => {
      const decision = await getDecisionForComment(comment);
      if (!decision) {
        return;
      }
      await implement_moderation_decision(auth, comment, decision);
    });
  },
};
