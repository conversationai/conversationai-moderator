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

import * as chai from 'chai';

import {
  Comment,
  CommentScoreRequest,
} from '@conversationai/moderator-backend-core';

import {
  expect,
  makeComment,
} from '../../test_helper';
import {
  app,
} from './test_helper';

const BASE_URL = `/services/authorCounts`;

async function fakeAuthor(authorSourceId: string, approvedCount: number, rejectedCount: number, otherCount: number) {
  for (let i = 0; i < approvedCount; i++) {
    await makeComment({ authorSourceId, isAccepted: true });
  }

  for (let i = 0; i < rejectedCount; i++) {
    await makeComment({ authorSourceId, isAccepted: false });
  }

  for (let i = 0; i < otherCount; i++) {
    await makeComment({ authorSourceId, isAccepted: null });
  }
}

describe(BASE_URL, () => {
  beforeEach(async () => {
    await CommentScoreRequest.destroy({where: {}});
    await Comment.destroy({where: {}});
  });

  describe('/authorCounts', () => {

    it('should return a lookup when asked for a single authorId', async () => {
      const apiClient = chai.request(app);

      const authorSourceId = '$2a$10$pMz0P4a/kq1h4pZwt7Ji8unFGQquqqStriJVFAN0Si.Eh49XUyUty';
      const approvedCount = 2;
      const rejectedCount = 7;
      const otherCount = 2;
      await fakeAuthor(authorSourceId, approvedCount, rejectedCount, otherCount);

      const { body } = await apiClient.post(`${BASE_URL}`).send({
        data: authorSourceId,
      });

      expect(body).to.deep.equal({
        data: {
          [authorSourceId]: {
            approvedCount,
            rejectedCount,
          },
        },
      });
    });

    it('should return a zeros when an author does not exist', async () => {
      const apiClient = chai.request(app);
      const authorSourceId = 'fake';

      const { body } = await apiClient.post(`${BASE_URL}`).send({
        data: [authorSourceId],
      });

      expect(body).to.deep.equal({
        data: {
          [authorSourceId]: {
            approvedCount: 0,
            rejectedCount: 0,
          },
        },
      });
    });

    it('should return a lookup when asked for mulitple authorIds', async () => {
      const apiClient = chai.request(app);
      const authorSourceId1 = '$2a$10$pMz0P4a/kq1h4pZwt7Ji8unFGQquqqStriJVFAN0Si.Eh49XUyUty';
      const approvedCount1 = 2;
      const rejectedCount1 = 7;
      const otherCount1 = 2;
      await fakeAuthor(authorSourceId1, approvedCount1, rejectedCount1, otherCount1);

      const authorSourceId2 = '52';
      const approvedCount2 = 2;
      const rejectedCount2 = 7;
      const otherCount2 = 2;
      await fakeAuthor(authorSourceId2, approvedCount2, rejectedCount2, otherCount2);

      const { body } = await apiClient.post(`${BASE_URL}`).send({
        data: [authorSourceId1, authorSourceId2],
      });

      expect(body).to.deep.equal({
        data: {
          [authorSourceId1]: {
            approvedCount: approvedCount1,
            rejectedCount: rejectedCount1,
          },
          [authorSourceId2]: {
            approvedCount: approvedCount2,
            rejectedCount: rejectedCount2,
          },
        },
      });
    });

  });

});
