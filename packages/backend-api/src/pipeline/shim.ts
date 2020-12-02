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

import { Comment } from '../models';

export interface IScore {
  score: number;
  begin?: number;
  end?: number;
}

export interface IScores {
  [key: string]: Array<IScore>;
}

export interface ISummaryScores {
  [key: string]: number;
}

export interface IScoreData {
  scores: IScores;
  summaryScores: ISummaryScores;
}

export interface IShim {
  /**
   * Send a single comment for scoring
   *
   * @param {object} comment  Comment to score
   * @param {string} correlator  String used to correlate this request with any out-of-band responses.
   * @return {object} Promise object indicating whether we've finished processing this request.
   */
  sendToScorer(comment: Comment, correlator: string | number): Promise<void>;
}
