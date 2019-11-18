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

import {
  Comment,
  CommentScoreRequest,
} from '../../../models';

import {
  expect,
  makeComment,
} from '../../fixture';

import {
  getAuthorCounts,
} from '../../../api/services/authorCounts';

describe('authorCounts Functions', () => {
  beforeEach(async () => {
    await CommentScoreRequest.destroy({where: {}});
    await Comment.destroy({where: {}});
  });

  describe('getAuthorCounts', () => {
    it('should return 0 for unknown authors', async () => {
      const results = await getAuthorCounts('fake');

      expect(results).to.be.deep.equal({
        approvedCount: 0,
        rejectedCount: 0,
      });
    });

    it('should count accepted and rejected', async () => {
      await makeComment({ authorSourceId: 'something else', isAccepted: true });

      const authorSourceId = 'test123';
      const approvedCount = 2;
      const rejectedCount = 7;
      const otherCount = 2;

      for (let i = 0; i < approvedCount; i++) {
        await makeComment({ authorSourceId, isAccepted: true });
      }

      for (let i = 0; i < rejectedCount; i++) {
        await makeComment({ authorSourceId, isAccepted: false });
      }

      for (let i = 0; i < otherCount; i++) {
        await makeComment({ authorSourceId, isAccepted: null });
      }

      const results = await getAuthorCounts(authorSourceId);

      expect(results).to.be.deep.equal({
        approvedCount,
        rejectedCount,
      });
    });
  });

});
