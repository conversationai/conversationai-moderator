/*
Copyright 2017 Google Inc.

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

import * as yargs from 'yargs';

import { for_all_youtube_users, youtubeSetTestOnly } from '../../integrations';
import { activate_channel, sync_channels } from '../../integrations/youtube/channels';
import { sync_comment_threads } from '../../integrations/youtube/comments';
import { sync_individual_videos, sync_known_videos, sync_playlists } from '../../integrations/youtube/videos';

export const command = 'test:youtube';
export const describe = 'Test out the youtube interface';

export function builder(args: yargs.Argv) {
  return args
    .usage('Usage: node $0 test:youtube');
}

export async function handler() {
  let channelId: string;
  let videoId: string;
  youtubeSetTestOnly((type, obj) => {
    console.log(type, obj);
    if (type === 'channel' && !channelId) {
      channelId = obj.id;
    }
    if (type === 'video' && !videoId) {
      videoId = obj.videoId;
    }
  });

  await for_all_youtube_users(async (owner, auth) => {
    console.log('\n\n*** Doing sync_channels');
    await sync_channels(owner, auth);
    if (channelId) {
      console.log('\n*** Testing disable');
      await activate_channel(owner, auth, channelId, false);
      console.log('\n*** Testing enable');
      await activate_channel(owner, auth, channelId, true);
    }

    console.log('\n\n*** Doing sync_playlists');
    await sync_playlists(owner, auth);

    console.log('\n*** Doing sync_known_videos');
    await sync_known_videos(owner, auth);
    if (videoId) {
      console.log('\n*** Doing sync_individual_videos');
      await sync_individual_videos(owner, auth, [videoId]);
    }

    console.log('\n\n*** Doing sync comments');
    await sync_comment_threads(owner, auth, true, 100);
    console.log('\n*** Doing incremental sync');
    await sync_comment_threads(owner, auth, false, 100);
  });
}
