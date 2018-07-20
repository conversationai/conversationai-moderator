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
  denormalizeCommentCountsForArticle,
  ModeratorAssignment,
} from '@conversationai/moderator-backend-core';

import {
  expect,
  makeArticle,
  makeComment,
  makeUser,
} from '../../test_helper';
import {
  app,
} from './test_helper';

const BASE_URL = `/services/assignments`;

describe(BASE_URL, () => {
  describe('/users/:id/count', () => {
    const url = `${BASE_URL}/users/:id/count`;

    beforeEach(async () => {
      this.article = await makeArticle();
      await makeComment({articleId: this.article.id});
      denormalizeCommentCountsForArticle(this.article);
      this.user = await makeUser();
    });

    it('Fetch counts of assigned comments', async () => {
      {
        const apiClient = chai.request(app);
        const {status, body} = await apiClient.get(url.replace(':id', this.user.id));
        expect(status).to.be.equal(200);
        expect(body.count).to.be.equal(0);
      }

      await ModeratorAssignment.create({
        userId: this.user.id,
        articleId: this.article.id,
      });

      {
        const apiClient = chai.request(app);
        const {status, body} = await apiClient.get(url.replace(':id', this.user.id));
        expect(status).to.be.equal(200);
        expect(body.count).to.be.equal(1);
      }
    });
  });
});
