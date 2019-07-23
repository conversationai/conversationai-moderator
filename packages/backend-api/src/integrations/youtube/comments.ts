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

import { logger } from '@conversationai/moderator-backend-core';
import { IUserInstance, MODERATION_ACTION_ACCEPT, MODERATION_ACTION_DEFER } from '@conversationai/moderator-backend-core';

import { for_each_active_channel } from './channels';
import { foreachPendingDecision, mapCommentThreadToComments, markDecisionExecuted } from './objectmap';
import { get_article_id_from_youtube_id } from './videos';

const service = google.youtube('v3');

async function sync_page_of_comments(
  owner: IUserInstance,
  auth: OAuth2Client,
  channelId: string,
  articleIdMap: Map<string, number>,
  maxResults: number,
  all: boolean,
  pageToken?: string,
) {
  return new Promise<string | undefined>((resolve, reject) => {
    service.commentThreads.list({
      auth: auth,
      allThreadsRelatedToChannelId: channelId,
      part: 'snippet,replies',
      textFormat: 'plainText',
      maxResults: maxResults,
      pageToken: pageToken,
      moderationStatus: !all ? 'heldForReview' : undefined,
    }, async (err: any, response: any) => {
      if (err) {
        logger.error('Google API returned an error: ' + err);
        reject('Google API error');
        return;
      }

      const comments = response!.data.items;
      const nextPageToken = response!.data.nextPageToken;

      if (comments.length === 0) {
        logger.info('Couldn\'t find any threads for channel %s.', channelId);
        resolve(undefined);
        return;
      }

      for (const t of comments) {
        const articleId = await get_article_id_from_youtube_id(
          owner,
          auth,
          articleIdMap,
          t.snippet.channelId,
          t.snippet.videoId,
        );
        if (articleId == null) {
          logger.info(`Couldn't map video ${t.snippet.videoId} to an article`);
          continue;
        }
        await mapCommentThreadToComments(owner, articleId, t);
      }
      resolve(nextPageToken);
    });
  });
}

export async function sync_comment_threads_for_channel(
  owner: IUserInstance,
  auth: OAuth2Client,
  channelId: string,
  articleIdMap: Map<string, number>,
  all: boolean,
  count?: number,
) {
  logger.info('Syncing comments for channel %s', channelId);

  let left = count || 10000;
  let next_page;
  do {
    next_page = await sync_page_of_comments(owner, auth, channelId, articleIdMap, 10, all, next_page);
    left -= 10;
  } while (next_page && left > 0);

  logger.info('Done sync of comments for channel %s.', channelId);
}

export async function sync_comment_threads(
  owner: IUserInstance,
  auth: OAuth2Client,
  all: boolean,
  count?: number,
) {
  await for_each_active_channel(owner, async (channelId: string, articleIdMap: Map<string, number>) => {
    await sync_comment_threads_for_channel(owner, auth, channelId, articleIdMap, all, count);
  });
}

export async function implement_moderation_decisions(
  owner: IUserInstance,
  auth: OAuth2Client,
) {
  await foreachPendingDecision(owner, async (decision, comment) => {
    const sourceId = comment.get('sourceId') as string;
    const status = decision.get('status');

    if (status === MODERATION_ACTION_DEFER) {
      logger.info('Not syncing comment %s:%s - in deferred state', comment.id, sourceId);
      markDecisionExecuted(decision);
      return;
    }

    const moderationStatus = (status === MODERATION_ACTION_ACCEPT) ? 'published' : 'rejected';
    logger.info('Syncing comment %s:%s to %s (%s) ', comment.id, sourceId, moderationStatus, decision.id);
    service.comments.setModerationStatus({
        auth: auth,
        id: sourceId,
        moderationStatus: moderationStatus,
      },
      (err) => {
        if (err) {
          logger.error(`Google API returned an error for comment ${comment.id}: ` + err);
          return;
        }
        markDecisionExecuted(decision);
      });
  });
}
