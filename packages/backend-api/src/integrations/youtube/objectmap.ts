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

import { pick } from 'lodash';

import { logger } from '../../logger';
import { Article, Category, Comment, updateHappened } from '../../models';
import {
  IAuthorAttributes,
  IUserInstance,
} from '../../models';
import { postProcessComment, sendForScoring } from '../../pipeline';

let testOnly = false;
let testCallback: (type: string, obj: any) => void;
export function youtubeSetTestOnly(c: typeof testCallback) {
  testOnly = true;
  testCallback = c;
}

export async function saveError(owner: IUserInstance, error: Error) {
  if (testOnly) {
    testCallback('error', error);
    return;
  }
  const extra = JSON.parse(owner.get('extra'));
  extra.lastError = pick(error, ['name', 'message']);
  owner.set('isActive', false);
  owner.set('extra', extra);
  await owner.save();
}

export async function clearError(owner: IUserInstance) {
  const extra = JSON.parse(owner.get('extra'));
  delete extra.lastError;
  owner.set('extra', extra);
  await owner.save();
}

export async function mapChannelToCategory(owner: IUserInstance, channel: any) {
  if (testOnly) {
    testCallback('channel', channel);
    return;
  }

  const channelId = channel.id!;
  const isActive = channel.brandingSettings.channel.moderateComments;

  const categoryDefaults = {
    label: channel.snippet!.title!,
    isActive: isActive,
  };

  try {
    const [category, created] = await Category.findOrCreate({
      where: {
        ownerId: owner.id,
        sourceId: channelId,
      },
      defaults: {
        ...categoryDefaults,
        ownerId: owner.id,
        sourceId: channelId,
      },
    });

    if (created) {
      logger.info(`Category created for channel "${category.get('label')}" (local id: ${category.id} -> remote id: ${channel.id})`);
    }
    else {
      category.set(categoryDefaults);
      await category.save();
      logger.info(`Category updated for channel "${category.get('label')}" (local id: ${category.id} -> remote id: ${channel.id})`);
    }

    // Create an article to store comments for the channel itself.
    // sourceId of this article is the channel ID
    const defaults = {
      categoryId: category.id,
      title: 'Channel comments',
      text: 'Comments associated with the channel itself.',
      url: 'https://www.youtube.com/channel/' + channelId,
      sourceCreatedAt: new Date(Date.parse(channel.snippet!.publishedAt!)),
    };
    const [article, acreated] = await Article.findOrCreate({
      where: {
        ownerId: owner.id,
        sourceId: channelId,
      },

      defaults: {
        ...defaults,
        ownerId: owner.id,
        sourceId: channelId,
        isCommentingEnabled: true,
        isAutoModerated: true,
      },
    });

    if (acreated) {
      logger.info(`Article created for channel "${article.get('title')}" (local id: ${article.id} -> remote id: ${channel.id})`);
    }
    else {
      article.set(defaults);
      await article.save();
      logger.info(`Article updated for channel "${article.get('title')}" (local id: ${article.id} -> remote id: ${channel.id})`);
    }
  }
  catch (error) {
    logger.error(`Failed update of article for channel "${channel.snippet!.title}": "${error}"`);
  }
}

export async function setChannelActive(owner: IUserInstance, channelId: string, brandingSettings: any) {
  const isActive: boolean = !!brandingSettings.channel.moderateComments;
  if (testOnly) {
    testCallback('setChannelActive', brandingSettings);
    return 0;
  }
  await Category.update({isActive} as any, {where: {ownerId: owner.id, sourceId: channelId}});
  await updateHappened();
}

export async function foreachActiveChannel(owner: IUserInstance, callback: (channelId: string, articleIdMap: Map<string, number>) => Promise<void>) {
  const categories = await Category.findAll({
    where: {
      ownerId: owner.id,
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

    await callback(channelId, articleIdMap);
  }
}

export async function mapVideoItemToArticle(
  owner: IUserInstance,
  categoryId: number,
  videoId: string,
  snippet: any,
): Promise<number|null> {
  if (testOnly) {
    testCallback('video', {videoId, snippet});
    return 0;
  }

  logger.info(`Got video "${snippet.title}" (${videoId})`);

  const defaults = {
    title: snippet.title.substring(0, 255),
    text: snippet.description,
    url: 'https://www.youtube.com/watch?v=' + videoId,
    sourceCreatedAt: new Date(Date.parse(snippet.publishedAt)),
    extra: snippet,
  };

  try {
    const [article, created] = await Article.findOrCreate({
      where: {
        sourceId: videoId,
      },

      defaults: {
        ...defaults,
        ownerId: owner.id,
        sourceId: videoId,
        categoryId: categoryId,
        isCommentingEnabled: true,
        isAutoModerated: true,
      },
    });

    if (created) {
      logger.info(`Created article ${article.id} for video ${article.get('sourceId')}`);
    }
    else {
      article.set(defaults);
      await article.save();
      logger.info(`Updated article ${article.id} for video ${article.get('sourceId')}`);
    }
    return article.id;
  }
  catch (error) {
    logger.error(`Failed update of video ${videoId}: ${error}`);
    return null;
  }
}

async function mapCommentToComment(
  owner: IUserInstance,
  articleId: number,
  ytcomment: any,
  replyToSourceId: string | undefined,
) {
  if (testOnly) {
    testCallback('comment', ytcomment);
    return;
  }

  try {
    const author: IAuthorAttributes = {
      name: ytcomment.snippet.authorDisplayName,
      avatar: ytcomment.snippet.authorProfileImageUrl,
    };

    const sourceCreatedAt = new Date(Date.parse(ytcomment.snippet.publishedAt));
    const defaults = {
      articleId: articleId,
      authorSourceId: ytcomment.snippet.authorChannelId.value,
      author: author,
      text: ytcomment.snippet.textDisplay,
      sourceCreatedAt,
      replyToSourceId: replyToSourceId,
      extra: ytcomment,
    };

    const [comment, created] = await Comment.findOrCreate({
      where: {
        sourceId: ytcomment.id,
      },

      defaults: {
        ownerId: owner.id,
        sourceId: ytcomment.id,
        ...defaults,
      },
    });

    if (created) {
      logger.info(`Created comment ${comment.id} (${comment.get('sourceId')})`);
    }
    else if (comment.get('sourceCreatedAt').getTime() === sourceCreatedAt.getTime()) {
      logger.info(`Comment ${comment.id} (${comment.get('sourceId')}) unchanged`);
      return;
    }
    comment.set(defaults);
    await comment.save();
    logger.info(`Updated comment ${comment.id} (${comment.get('sourceId')})`);

    try {
      await postProcessComment(comment);
      await sendForScoring(comment);
    }
    catch (error) {
      logger.error(`Failed sendForScoring of comment ${comment.id}: ${error}`);
    }
  }
  catch (error) {
    logger.error(`Failed update of comment ${ytcomment.id}: ${error}`);
  }
}

export async function mapCommentThreadToComments(
  owner: IUserInstance,
  articleId: number,
  thread: any,
) {
  await mapCommentToComment(owner, articleId, thread.snippet.topLevelComment, undefined);
  if (thread.replies) {
    for (const c of thread.replies.comments) {
      await mapCommentToComment(owner, articleId, c, thread.snippet.topLevelComment.id);
    }
  }
}
