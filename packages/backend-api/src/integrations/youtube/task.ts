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

import { for_all_youtube_users } from './authenticate';
import { sync_channels } from './channels';
import { implement_moderation_decisions, sync_comment_threads } from './comments';
import { clearError } from './objectmap';
import { sync_known_videos } from './videos';

// Tick is every minute.  Channel sync once per day.
const CHANNEL_SYNC_INTERVAL = 60 * 24;
const COMMENT_SYNC_INTERVAL = 5;

export async function syncYoutubeTask(tick: number) {
  if (tick % COMMENT_SYNC_INTERVAL === 0) {
    await for_all_youtube_users(async (owner, auth) => {
      if (tick % CHANNEL_SYNC_INTERVAL === 0) {
        await clearError(owner);
        await sync_channels(owner, auth);
        await sync_known_videos(owner, auth);
        await implement_moderation_decisions(owner, auth);
      }
      await sync_comment_threads(owner, auth, false);
    });
  }
}
