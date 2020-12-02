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
import { google } from 'googleapis';
import * as requestRaw from 'request';
import * as striptags  from 'striptags';

import { logger } from '../logger';
import {
  Comment,
  IRequestedAttributes,
  IScorerExtra,
  User,
} from '../models';
import { IScoreData } from './shim';

const request = Bluebird.promisify(requestRaw) as any;
Bluebird.promisifyAll(request);

// Perspective API request types.
interface ITextEntry {
  text: string;
}

interface IAnalyzeCommentRequest {
  comment: ITextEntry;
  context: { entries: Array<ITextEntry>; };
  requestedAttributes: IRequestedAttributes;
  languages?: Array<string>;
  clientToken?: string;
  spanAnnotations?: boolean;
}

// Perspective API response types.
interface ISpanScore {
  begin: number;
  end: number;
  score: { value: number; };
}

interface IAttributeScores {
  [attribute: string]: {
    spanScores?: Array<ISpanScore>;
    summaryScore?: { value: number; };
  };
}

interface IAnalyzeCommentResponse {
  attributeScores?: IAttributeScores;
  languages?: Array<string>;
  clientToken?: string;
}

// Removes '@...' suffix, if present.
function StripAttributeVersion(attributeName: string): string {
  return attributeName.replace(/@.*/, '');
}

/**
 * Create a scorer that sends comments to an endpoint for scoring
 *
 * @param {object} scorer  Service User that owns this scorer.
 * @param {object} processMachineScore  Callback to invoke if score is determined synchronously.
 */
export async function createShim(
    scorer: User,
    processMachineScore: (commentId: number, serviceUserId: number, scoreData: IScoreData) => Promise<void>,
    ) {
  const serviceUserId = scorer.id;
  const extra = scorer.extra as IScorerExtra;
  const discoveryURL = extra.endpoint;
  const apiKey = extra.apiKey;
  const attributes = extra.attributes;
  const userAgent = extra.userAgent;

  async function packPerspectiveApiRequest(comment: Comment, reqId: string | number) {
    const req: IAnalyzeCommentRequest = {
      comment: {text: striptags(comment.text)},
      context: {entries: []},
      requestedAttributes: attributes!,
      languages: ['en'],
      clientToken: userAgent + '_request' + reqId,
      spanAnnotations: true,
    };

    const article = await comment.getArticle();
    if (article) {
      req.context.entries.push({text: striptags(article.text)});
    }

    const replyTo = await comment.getReplyTo();
    if (replyTo) {
      req.context.entries.push({text: striptags(replyTo.text)});
    }

    return req;
  }

  function unpackPerspectiveApiResponse(comment: Comment, data: IAnalyzeCommentResponse): IScoreData {
    const unpackedData: IScoreData = {scores: {}, summaryScores: {}};

    for (const attributeName in data.attributeScores!) {
      const unversionedName = StripAttributeVersion(attributeName);
      const attributeScore = data.attributeScores![attributeName];

      if (attributeScore.spanScores && attributeScore.spanScores.length > 0) {
        unpackedData.scores[unversionedName] = attributeScore.spanScores.map(
          ({begin, end, score: {value}}) => ({begin, end, score: value}),
        );
      }

      if (attributeScore.summaryScore) {
        unpackedData.summaryScores[unversionedName] = attributeScore.summaryScore.value;

        if (!unpackedData.scores[unversionedName]) {
          // Not got a spanScores entry, so make one up from the summary
          const begin = 0;
          const end = comment.text.length;
          const value = attributeScore.summaryScore.value;
          unpackedData.scores[unversionedName] = [{begin, end, score: value}];
        }
      }
      else {
        logger.error(`Comment ${comment.id}:Strangely there are no summary scores for ${attributeName}`);
      }
    }

    return unpackedData;
  }

  const endpoint = await google.discoverAPI(discoveryURL);
  if (!(endpoint.comments && (endpoint.comments as any).analyze)) {
    throw Error('Unknown error loading API: client is b0rken');
  }

  return {
    sendToScorer: async (comment: Comment, reqId: string | number) => {
      const papiRequest = await packPerspectiveApiRequest(comment, reqId);
      const papiResponse = await (endpoint.comments as any).analyze({key: apiKey, resource: papiRequest});
      const unpackedResponse = unpackPerspectiveApiResponse(comment, papiResponse.data);
      await processMachineScore(comment.id, serviceUserId, unpackedResponse);
    },
  };
}
