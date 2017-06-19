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

import { expect } from 'chai';
import { calculateTopScore } from '../../../domain/commentScores';
import { CommentScore } from '../../../models';

// tslint:disable no-import-side-effect
import '../../test_helper';
// tslint:enable no-import-side-effect

describe('calculateTopScore', () => {
  it('finds the higest score with a range', async () => {
    const commentScores = [
      CommentScore.build({ commentId: 1, tagId: 1, sourceType: 'Machine', score: 1, annotationStart: null, annotationEnd: null }),
      CommentScore.build({ commentId: 2, tagId: 1, sourceType: 'Machine', score: 0.75, annotationStart: 0, annotationEnd: 1 }),
      CommentScore.build({ commentId: 3, tagId: 1, sourceType: 'Machine', score: 0.5, annotationStart: 2, annotationEnd: 3 }),
      CommentScore.build({ commentId: 4, tagId: 1, sourceType: 'Machine', score: 0.0, annotationStart: 1, annotationEnd: 2 }),
    ];

    const topScore = calculateTopScore(commentScores);

    expect(topScore).to.be.equal(commentScores[1]);
  });

  it('returns null if no score has a range', async () => {
    const topScore = calculateTopScore([
      CommentScore.build({ commentId: 1, tagId: 1, sourceType: 'Machine', score: 1, annotationStart: null, annotationEnd: null }),
    ]);

    expect(topScore).to.be.null;
  });
});
