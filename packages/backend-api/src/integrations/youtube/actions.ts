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

import { Category, User } from '../../models';
import { for_one_youtube_user } from './authenticate';
import { activate_channel, get_article_id_map_for_channel } from './channels';
import { sync_comment_threads_for_channel } from './comments';

export async function youtubeActivateChannel(
  owner: User,
  channel: Category,
  args: {[key: string]: boolean},
) {
  await for_one_youtube_user(owner, async (_, auth) => {
    await activate_channel(owner, auth, channel.sourceId!, args.activate);
  });
}

export async function youtubeSynchronizeChannel(
  owner: User,
  channel: Category,
) {
  const articleIdMap = await get_article_id_map_for_channel(channel);
  await for_one_youtube_user(owner, async (_, auth) => {
    await sync_comment_threads_for_channel(
      owner,
      auth,
      channel.sourceId!,
      articleIdMap,
      true,
      1000,
    );
  });
}
