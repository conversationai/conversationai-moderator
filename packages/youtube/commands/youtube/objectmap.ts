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

import {Article, Category, Comment, Decision} from '@conversationai/moderator-backend-core';
import {IAuthorAttributes, ICommentInstance, IDecisionInstance} from '@conversationai/moderator-backend-core';
import {logger, sequelize} from '@conversationai/moderator-backend-core';
import {postProcessComment, sendForScoring} from '@conversationai/moderator-backend-core';

export async function mapChannelToCategory(channel: any) {
  const channelId = channel.id!;

  try {
    const [category, created] = await Category.findOrCreate({
      where: {
        sourceId: channelId,
      },
      defaults: {
        label: channel.snippet!.title!,
        sourceId: channelId,
      },
    });

    if (created) {
      logger.info('Category created for channel %s (local id: %s -> remote id: %s)', category.get('label'), category.id, channel.id);
    }
    else {
      logger.info('Category updated for channel %s (local id: %s -> remote id: %s)', category.get('label'), category.id, channel.id);
    }

    // Create an article to store comments for the channel itself.
    // sourceId of this article is the channel ID
    const [article, acreated] = await Article.findOrCreate({
      where: {
        sourceId: channelId,
      },

      defaults: {
        sourceId: channelId,
        categoryId: category.id,
        title: channel.snippet!.title!,
        text: 'Comments associated with the channel itself.',
        url: 'https://www.youtube.com/channel/' + channelId,
        sourceCreatedAt: new Date(Date.parse(channel.snippet!.publishedAt!)),
      },
    });

    if (acreated) {
      logger.info('Article created for channel %s (local id: %s -> remote id: %s)', article.get('title'), article.id, channel.id);
    }
    else {
      logger.info('Article updated for channel %s (local id: %s -> remote id: %s)', article.get('title'), article.id, channel.id);
    }
  }
  catch (error) {
    logger.error('Failed update of channel%s: %s', channel.snippet!.title, error);
  }
}

export async function foreachActiveChannel(callback: (channelId: string, articleIdMap: Map<string, number>) => void) {
  const categories = await Category.findAll({
    where: {
      sourceId: {ne: null},
      isActive: true,
    },
  });

  for (const category of categories) {
    const categoryId = category.get('id');
    const channelId = category.get('sourceId');

    const articles = await Article.findAll({
      where: {
        categoryId: categoryId,
      },
      attributes: ['id', 'sourceId'],
    });

    const articleIdMap = new Map<string, number>();
    for (const a of articles) {
      articleIdMap.set(a.get('sourceId'), a.id);
    }

    callback(channelId, articleIdMap);
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

    const author: IAuthorAttributes = {
      name: ytcomment.snippet.authorDisplayName,
      avatar: ytcomment.snippet.authorProfileImageUrl,
    };

    const [comment, created] = await Comment.findOrCreate({
      where: {
        sourceId: ytcomment.id,
      },

      defaults: {
        sourceId: ytcomment.id,
        articleId: articleId,
        authorSourceId: ytcomment.snippet.authorChannelId.value,
        author: author,
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

export async function mapCommentThreadToComments(channelId: string, articleIds: Map<string, number>, thread: any) {
  let articleId = articleIds.get(thread.snippet.videoId);
  if (!articleId) {
    articleId = articleIds.get(channelId);
  }
  await mapCommentToComment(articleId!, thread.snippet.topLevelComment, undefined);
  if (thread.replies) {
    for (const c of thread.replies.comments) {
      await mapCommentToComment(articleId!, c, thread.snippet.topLevelComment.id);
    }
  }
}

export async function foreachPendingDecision(callback: (decision: IDecisionInstance, comment: ICommentInstance) => void) {
  const decisions = await Decision.findAll({
    where: {
      sentBackToPublisher: null,
      isCurrentDecision: true,
    } as any,
    include: [Comment],
  });

  for (const d of decisions) {
    callback(d, await d.getComment());
  }
}

export async function markDecisionExecuted(decision: IDecisionInstance) {
  decision.set('sentBackToPublisher', sequelize.fn('now')).save();
  const comment = await decision.getComment();
  comment.set('sentBackToPublisher', sequelize.fn('now')).save();
}
