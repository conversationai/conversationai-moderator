/*
Copyright 2018 Google Inc.

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

import {Article, Category, Comment, logger} from '@conversationai/moderator-backend-core';
import {postProcessComment, sendForScoring} from '@conversationai/moderator-backend-core';

export async function mapChannelToCategory(channel: any) {
  try {
    const [category, created] = await Category.findOrCreate({
      where: {
        sourceId: channel.id!,
      },
      defaults: {
        label: channel.snippet!.title!,
        sourceId: channel.id!,
      },
    });

    if (created) {
      logger.info('Category created for channel %s (local id: %s -> remote id: %s)', category.get('label'), category.id, channel.id);
    }
    else {
      logger.info('Category updated for channel %s (local id: %s -> remote id: %s)', category.get('label'), category.id, channel.id);
    }
  }
  catch (error) {
    logger.error('Failed update of channel%s: %s', channel.snippet!.title, error);
  }
}

export async function mapPlaylistItemToArticle(categoryId: number, item: any) {
  const videoId = item.snippet.resourceId.videoId;
  logger.info('Got video %s (%s)', item.snippet.title, videoId);

  try {
    const [article, created] = await Article.findOrCreate({
      where: {
        sourceId: videoId,
      },

      defaults: {
        sourceId: videoId,
        categoryId: categoryId,
        title: item.snippet.title.substring(0, 255),
        text: item.snippet.description,
        url: 'https://www.youtube.com/watch?v=' + videoId,
        sourceCreatedAt: new Date(Date.parse(item.snippet.publishedAt)),
        extra: item,
      },
    });

    if (created) {
      logger.info('Created article %s for video %s', article.id, article.get('sourceId'));
    }
    else {
      logger.info('Updated article %s for video %s', article.id, article.get('sourceId'));
    }
  }
  catch (error) {
    logger.error('Failed update of video %s: %s', videoId, error);
  }
}

async function mapCommentToComment(articleId: number, ytcomment: any, replyToSourceId: string | undefined) {
  try {
    const [comment, created] = await Comment.findOrCreate({
      where: {
        sourceId: ytcomment.id,
      },

      defaults: {
        sourceId: ytcomment.id,
        articleId: articleId,
        authorSourceId: ytcomment.snippet.authorChannelId.value,
        author: ytcomment.snippet.authorDisplayName,
        text: ytcomment.snippet.textDisplay,
        sourceCreatedAt: new Date(Date.parse(ytcomment.snippet.publishedAt)),
        replyToSourceId: replyToSourceId,
        extra: ytcomment,
      },
    });

    if (created) {
      logger.info('Created comment %s (%s)', comment.id, comment.get('sourceId'));
    }
    else {
      logger.info('Updated comment %s (%s)', comment.id, comment.get('sourceId'));
    }

    try {
      await postProcessComment(comment);
      await sendForScoring(comment);
    }
    catch (error) {
      logger.error('Failed sendForScoring of comment %s: %s', comment.id, error);
    }
  }
  catch (error) {
    logger.error('Failed update of comment %s: %s', ytcomment.id, error);
  }
}

export async function mapCommentThreadToComments(articleIds: Map<string, number>, thread: any) {
  let articleId = articleIds.get(thread.snippet.videoId);
  if (!articleId) {
    articleId = 5; // TODO: Need to create the article for channel comments.
  }
  await mapCommentToComment(articleId, thread.snippet.topLevelComment, undefined);
  if (thread.replies) {
    for (const c of thread.replies.comments) {
      await mapCommentToComment(articleId, c, thread.snippet.topLevelComment.id);
    }
  }
}
