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

import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { Op } from 'sequelize';

import { logger } from '../../logger';
import { Article, Category, User } from '../../models';
import { get_playlist_for_channel } from './channels';
import { mapVideoItemToArticle, saveError } from './objectmap';

const service = google.youtube('v3');

async function sync_page_of_videos(
  owner: User,
  auth: OAuth2Client,
  category: Category,
  playlist: string,
  pageToken?: string,
) {
  return new Promise<string | undefined>((resolve, reject) => {
    service.playlistItems.list({
      auth: auth,
      playlistId: playlist,
      part: 'snippet',
      maxResults: 50,
      pageToken: pageToken,
    }, async (err: any, response: any) => {
      if (err) {
        await saveError(owner, err);
        logger.error('Google API returned an error: ' + err);
        reject('Google API error');
        return;
      }

      const videos = response!.data.items;
      const nextPageToken = response!.data.nextPageToken;

      if (videos.length === 0) {
        logger.info(`Couldn't find any videos in playlist ${playlist}.`);
        resolve(undefined);
        return;
      }

      for (const item of response.data.items) {
        const videoId = item.snippet.resourceId.videoId;
        await mapVideoItemToArticle(owner, category.id, videoId, item.snippet);
      }
      resolve(nextPageToken);
    });
  });
}

export async function sync_playlists(
  owner: User,
  auth: OAuth2Client,
) {
  logger.info(`Syncing videos for user ${owner.email}.`);
  const categories = await Category.findAll({
    where: {
      ownerId: owner.id,
      sourceId: {[Op.ne]: null},
      isActive: true,
    },
  });

  for (const category of categories) {
    const channelId = category.sourceId!;

    const playlist = await get_playlist_for_channel(owner, auth, channelId);
    logger.info(`Syncing channel ${category.label} (${channelId}/${playlist})`);

    let next_page;
    do {
      next_page = await sync_page_of_videos(owner, auth, category, playlist, next_page);
    } while (next_page);

    logger.info(`Done sync of ${category.label}.`);
  }
}

export async function sync_individual_videos(
  owner: User,
  auth: OAuth2Client,
  videoIds: Array<string>,
): Promise<Array<number> | null> {
  return new Promise< Array<number> | null >((resolve, reject) => {
    service.videos.list({
      auth: auth,
      part: 'snippet',
      id: videoIds.join(),
    },  async (err: any, response: any) => {
      if (err) {
        await saveError(owner, err);
        logger.error('Google API returned an error: ' + err);
        reject('Google API error');
        return;
      }

      if (response.data.items.length === 0) {
        logger.error(`Sync single video: No such video ${videoIds.join()}`);
        reject(`No such video ${videoIds.join()}`);
        return;
      }

      const articleIds: Array<number> = [];
      for (const video of response.data.items) {
        const category = await Category.findOne({
          where: {
            ownerId: owner.id,
            sourceId: video.snippet.channelId,
          },
        });

        if (!category) {
          logger.error(`No category for video ${video.id} ${video.snippet.channelId}`);
          reject(`No category for video ${video.id} ${video.snippet.channelId}`);
          return;
        }

        const articleId = await mapVideoItemToArticle(owner, category.id, video.id, video.snippet);
        if (articleId) {
          articleIds.push(articleId);
        }
      }
      resolve(articleIds);
    });
  });
}

export async function sync_known_videos(
  owner: User,
  auth: OAuth2Client,
) {
  logger.info(`Syncing known videos for user ${owner.email}.`);
  const articles = await Article.findAll({
    where: {
      ownerId: owner.id,
    },
    include: [{
      model: Category,
      where: { isActive: true },
    }],
  });

  let videoIds: Array<string> = [];
  for (const article of articles) {
    videoIds.push(article.sourceId);
    if (videoIds.length === 10) {
      await sync_individual_videos(owner, auth, videoIds);
      videoIds = [];
    }
  }
  if (videoIds.length > 0) {
    await sync_individual_videos(owner, auth, videoIds);
  }
}

export async function get_article_id_from_youtube_id(
  owner: User,
  auth: OAuth2Client,
  articleIds: Map<string, number>,
  channelId: string,
  videoId: string,
): Promise<number | null> {
  if (videoId) {
    if (articleIds.has(videoId)) {
      return articleIds.get(videoId)!;
    }

    const returnedIds = await sync_individual_videos(owner, auth, [videoId]);
    if (returnedIds === null) {
      return null;
    }
    articleIds.set(videoId, returnedIds[0]);
    return returnedIds[0];
  }
  else {
    return articleIds.get(channelId) || null;
  }
}
