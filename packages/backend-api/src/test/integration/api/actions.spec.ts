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

import * as chai from 'chai';

import {
  denormalizeCommentCountsForArticle,
  denormalizeCountsForComment,
} from '../../../domain';
import {
  Article,
  Category,
  Comment,
  CommentFlag,
  User,
} from '../../../models';
import {
  expect,
  makeArticle,
  makeComment,
  makeFlag,
  makeUser,
} from '../../fixture';
import { app, setAuthenticatedUser } from './test_helper';

const BASE_URL = `/services/commentActions`;

describe(BASE_URL, () => {
  let article: Article;
  let comment1: Comment;
  let comment2: Comment;
  let user: User;
  let user2: User;
  let unresolved1: CommentFlag;
  let unresolved2: CommentFlag;
  let resolved1: CommentFlag;
  let unresolved3: CommentFlag;

  async function checkArticle(
    x: string,
    newCount: number,
    approvedCount: number,
    rejectedCount: number,
    flagsCount: number,
  ) {
    const a1 = (await Article.findByPk(article.id))!;
    expect(a1.unmoderatedCount, `${x} article newCount`).equal(newCount);
    expect(a1.approvedCount, `${x} article approvedCount`).equal(approvedCount);
    expect(a1.rejectedCount, `${x} article rejectedCount`).equal(rejectedCount);
    expect(a1.flaggedCount, `${x} article flaggedCount`).equal(flagsCount);
  }

  async function checkComment(
    x: string,
    id: number,
    state: 'new' | 'accepted' | 'rejected',
    unresolved: number,
    summary: {[key: string]: Array<number>},
  ) {
    const c = (await Comment.findByPk(id))!;
    if (state === 'new') {
      expect(c.isModerated, `${x} comment ${id} is moderated`).equal(false);
    }
    else {
      expect(c.isModerated, `${x} comment ${id} is moderated`).equal(true);
      expect(c.isAccepted,  `${x} comment ${id} is accepted`).equal(state === 'accepted');
    }

    expect(c.unresolvedFlagsCount, `${x} comment ${id} unresolved`).equals(unresolved);
    const s = c.flagsSummary;
    expect(s, `${x} comment ${id} summary`).deep.equal(summary);
  }

  async function checkFlag(x: string, id: number, resolved: boolean, resolvedById: number | null) {
    const f = (await CommentFlag.findByPk(id))!;
    expect(f.isResolved, `${x} flag ${id} isResolved`).equal(resolved);
    expect(f.resolvedById, `${x} flag ${id} resolvedById`).equal(resolvedById);
  }

  async function actOnAComment(url: string) {
    const apiClient = chai.request(app);
    const {status} = await apiClient.post(url).send({
      data: [{commentId: comment1.id.toString()}],
      runImmediately: true,
    });
    expect(status).equal(200);
  }

  beforeEach(async () => {
    article = await makeArticle({});
    comment1 = await makeComment({articleId: article.id, isModerated: false});
    comment2 = await makeComment({articleId: article.id, isModerated: true, isAccepted: true});
    user = await makeUser();
    setAuthenticatedUser(user);
    user2 = await makeUser({email: 'other@example.com'});
    unresolved1 = await makeFlag({commentId: comment1.id, label: 'unresolved 1'});
    unresolved2 = await makeFlag({commentId: comment1.id, label: 'unresolved 2', isRecommendation: true});
    resolved1 = await makeFlag({commentId: comment1.id, label: 'resolved 1', isResolved: true, resolvedById: user2.id });
    unresolved3 = await makeFlag({commentId: comment2.id, label: 'unresolved 3'});
    await denormalizeCountsForComment(comment1);
    await denormalizeCountsForComment(comment2);
    await denormalizeCommentCountsForArticle(article, false);
  });

  afterEach(async () => {
    await CommentFlag.destroy({where: {}});
    await Comment.destroy({where: {}});
    await Article.destroy({where: {}});
    await Category.destroy({where: {}});
    await User.destroy({where: {}});
  });

  it('approve comment then flags', async () => {
    await checkArticle('a', 1, 1, 0, 2);
    await checkComment('a1', comment1.id, 'new', 2, {
      'unresolved 1': [1, 1, 0],
      'unresolved 2': [1, 1, 1],
      'resolved 1': [1, 0, 0],
    });
    await checkComment('a2', comment2.id, 'accepted', 1, {
      'unresolved 3': [1, 1, 0],
    });
    await checkFlag('a1', unresolved1.id, false, null);
    await checkFlag('a2', unresolved2.id, false, null);
    await checkFlag('a3', resolved1.id, true, user2.id);
    await checkFlag('a4', unresolved3.id, false, null);

    await actOnAComment(`${BASE_URL}/approve`);
    await checkArticle('b', 0, 2, 0, 2);
    await checkComment('b1', comment1.id, 'accepted', 2, {
      'unresolved 1': [1, 1, 0],
      'unresolved 2': [1, 1, 1],
      'resolved 1': [1, 0, 0],
    });
    await checkComment('b2', comment2.id, 'accepted', 1, {
      'unresolved 3': [1, 1, 0],
    });
    await checkFlag('b1', unresolved1.id, false, null);
    await checkFlag('b2', unresolved2.id, false, null);
    await checkFlag('b3', resolved1.id, true, user2.id);
    await checkFlag('b4', unresolved3.id, false, null);

    await actOnAComment(`${BASE_URL}/approve-flags`);
    await checkArticle('c', 0, 2, 0, 1);
    await checkComment('c1', comment1.id, 'accepted', 0, {
      'unresolved 1': [1, 0, 0],
      'unresolved 2': [1, 0, 1],
      'resolved 1': [1, 0, 0],
    });
    await checkComment('c2', comment2.id, 'accepted', 1, {
      'unresolved 3': [1, 1, 0],
    });
    await checkFlag('c1', unresolved1.id, true, user.id);
    await checkFlag('c2', unresolved2.id, true, user.id);
    await checkFlag('c3', resolved1.id, true, user2.id);
    await checkFlag('c4', unresolved3.id, false, null);
  });

  it('approve comment and flags', async () => {
    await actOnAComment(`${BASE_URL}/approve-flags`);
    await checkArticle('c', 0, 2, 0, 1);
    await checkComment('c', comment1.id, 'accepted', 0, {
      'unresolved 1': [1, 0, 0],
      'unresolved 2': [1, 0, 1],
      'resolved 1': [1, 0, 0],
    });
    await checkFlag('c1', unresolved1.id, true, user.id);
    await checkFlag('c2', unresolved2.id, true, user.id);
  });

  it('reject comment, then approve.', async () => {
    await actOnAComment(`${BASE_URL}/reject`);
    await checkArticle('a', 0, 1, 1, 1);
    await checkComment('a', comment1.id, 'rejected', 2, {
      'unresolved 1': [1, 1, 0],
      'unresolved 2': [1, 1, 1],
      'resolved 1': [1, 0, 0],
    });
    await checkFlag('a1', unresolved1.id, false, null);
    await checkFlag('a2', unresolved2.id, false, null);
    await checkFlag('a3', resolved1.id, true, user2.id);

    await actOnAComment(`${BASE_URL}/approve`);
    await checkArticle('b', 0, 2, 0, 2);
    await checkComment('b', comment1.id, 'accepted', 2, {
      'unresolved 1': [1, 1, 0],
      'unresolved 2': [1, 1, 1],
      'resolved 1': [1, 0, 0],
    });
    await checkFlag('b1', unresolved1.id, false, null);
    await checkFlag('b2', unresolved2.id, false, null);
    await checkFlag('b3', resolved1.id, true, user2.id);
  });

  it('reject all comments and flags', async () => {
    const url = `${BASE_URL}/reject-flags/`;
    const apiClient = chai.request(app);
    const {status} = await apiClient.post(url).send(
      {
        data: [
          { commentId: comment1.id.toString() },
          { commentId: comment2.id.toString() },
        ],
        runImmediately: true },
    );
    expect(status).equal(200);
    await checkArticle('c', 0, 0, 2, 0);
    await checkComment('c1', comment1.id, 'rejected', 0, {
      'unresolved 1': [1, 0, 0],
      'unresolved 2': [1, 0, 1],
      'resolved 1': [1, 0, 0],
    });
    await checkComment('c2', comment2.id, 'rejected', 0, {
      'unresolved 3': [1, 0, 0],
    });
    await checkFlag('c1', unresolved1.id, true, user.id);
    await checkFlag('c2', unresolved2.id, true, user.id);
    await checkFlag('c3', resolved1.id, true, user2.id);
    await checkFlag('c4', unresolved3.id, true, user.id);
  });

  it('resolve flags', async () => {
    const url = `${BASE_URL}/resolve-flags/`;
    const apiClient = chai.request(app);
    const {status} = await apiClient.post(url).send(
      {
        data: [
          { commentId: comment1.id.toString() },
          { commentId: comment2.id.toString() },
        ],
        runImmediately: true },
    );
    expect(status).equal(200);
    await checkArticle('c', 1, 1, 0, 0);
    await checkComment('c1', comment1.id, 'new', 0, {
      'unresolved 1': [1, 0, 0],
      'unresolved 2': [1, 0, 1],
      'resolved 1': [1, 0, 0],
    });
    await checkComment('c2', comment2.id, 'accepted', 0, {
      'unresolved 3': [1, 0, 0],
    });
    await checkFlag('c1', unresolved1.id, true, user.id);
    await checkFlag('c2', unresolved2.id, true, user.id);
    await checkFlag('c3', resolved1.id, true, user2.id);
    await checkFlag('c4', unresolved3.id, true, user.id);
  });
});
