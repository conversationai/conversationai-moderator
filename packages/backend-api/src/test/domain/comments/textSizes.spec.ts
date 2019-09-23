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
  cacheTextSize,
} from '../../../domain';
import {
  CommentSize,
} from '../../../models';
import {
  createArticle,
  createComment,
} from './fixture';

// tslint:disable no-import-side-effect
import '../../test_helper';
// tslint:enable no-import-side-effect

const assert = chai.assert;

describe('Comments Domain Text Sizing Tests', () => {
  describe('cacheTextSize', () => {
    it('should return false for no score requests', async () => {
      const article = await createArticle();
      const comment = await createComment({
        articleId: article.id,
        text: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
      });

      const width = 600;
      const height = await cacheTextSize(comment, width);

      assert.equal(height, 144);

      const commentSizes = await CommentSize.count({
        where: {
          commentId: comment.id,
          width,
          height,
        },
      });

      assert.equal(commentSizes, 1);
    });
  });
});
