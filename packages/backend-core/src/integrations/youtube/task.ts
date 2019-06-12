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

import { logger } from '../../logger';
import { for_all_youtube_users } from './authenticate';
import { sync_page_of_channels } from './channels';

// Tick is every minute.  Channel sync once per day.
const CHANNEL_SYNC_INTERVAL = 60 * 24;

export async function syncYoutubeTask(tick: number) {
  await for_all_youtube_users(async (owner, auth) => {
    if (tick % CHANNEL_SYNC_INTERVAL === 0) {
      logger.info('Syncing channels for user %s.', owner.get('email'));
      let next_page;
      do {
        next_page = await sync_page_of_channels(owner, auth, next_page);
      } while (next_page);
    }
  });
}
