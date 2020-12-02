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

import * as Bluebird from 'bluebird';
import * as requestRaw from 'request';
import * as striptags  from 'striptags';
import { rtrim } from 'underscore.string';

import { config } from '../config';
import { logger } from '../logger';
import {
  Comment,
  User,
} from '../models';
import { IScoreData } from './shim';

const request = Bluebird.promisify(requestRaw) as any;
Bluebird.promisifyAll(request);

interface IBotPostData {
  sync?: boolean;

  comment: {
    commentId: number;
    plainText: string;
    htmlText: string;
    links: {
      self: string;
    };
  };

  article: {
    articleId: number;
    plainText: string;
    links: {
      self: string;
    };
  };

  includeSummaryScores: true;

  inReplyToComment?: {
    commentId: number;
    plainText: string;
    htmlText: string;
    links: {
      self: string;
    };
  };

  links: {
    callback: string;
  };
}

/**
 * Create a scorer that sends comments to an endpoint for scoring
 *
 * @param {object} scorer  Service User that owns this scorer.
 * @param {object} processMachineScore  Callback to invoke if score is determined synchronously.
 */
export function createShim(
    scorer: User,
    processMachineScore: (commentId: number, serviceUserId: number, scoreData: IScoreData) => Promise<void>,
    ) {
  const serviceUserId = scorer.id;
  const extra: any = scorer.extra;
  const endpoint = extra.endpoint;
  const apiURL = rtrim(config.get('api_url'), '/');
  const apiKey = extra.apiKey;

  return {
    sendToScorer: async (comment: Comment, correlator: string | number) => {
      const article = await comment.getArticle();

      // Ensure data is present, otherwise an error will throw.
      if (!article) {
        logger.error(`sendToScorer: Article ${comment.articleId} not found for comment ${comment.id}.`);
        throw new Error(`No article for comment ${comment.id}.  Can't score.`);
      }

      const postData: IBotPostData = {
        sync: true,
        includeSummaryScores: true,

        comment: {
          commentId: comment.id,
          plainText: striptags(comment.text),
          htmlText: comment.text,
          links: {
            self: apiURL + '/rest/comments/' + comment.id,
          },
        },

        article: {
          articleId: article.id,
          plainText: striptags(article.text),
          links: {
            self: apiURL + '/rest/articles/' + article.id,
          },
        },

        links: {
          callback: apiURL + '/assistant/scores/' + correlator,
        },
      };

      // Check for a `replyTo`
      const replyTo = await comment.getReplyTo();
      if (replyTo) {
        postData.inReplyToComment = {
          commentId: replyTo.id,
          plainText: striptags(replyTo.text),
          htmlText: replyTo.text,
          links: {
            self: apiURL + '/rest/comments/' + replyTo.id,
          },
        };
      }

      logger.info(
        `Sending comment id ${comment.id} for scoring ` +
        `by service user id ${serviceUserId} ` +
        `to endpoint: ${endpoint}`,
        postData,
      );

      const response = await request.postAsync({
        url: endpoint,
        json: true,
        body: postData,
        headers: {
          Authorization: apiKey,
        },
      });

      logger.info(`Assistant Endpoint Response :: ${response.statusCode}`);

      if (response.statusCode !== 200) {
        logger.error(`Error posting comment id ${comment.id} for scoring. ` +
          `Server responded with status ${response.statusCode}: ${response.body}`);
        throw new Error(`Comment ${comment.id}: server failed to score.`);
      }

      await processMachineScore(comment.id, serviceUserId, response.body);
    },
  };
}
