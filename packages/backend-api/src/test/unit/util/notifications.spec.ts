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

import {updateArticleAssignments, updateCategoryAssignments} from '../../../actions/assignment_updaters';
import {
  createRangeObject,
  createTagObject,
  deleteRangeObject,
  modifyRangeObject,
  modifyTagObject,
} from '../../../actions/object_updaters';
import { denormalizeCommentCountsForArticle } from '../../../domain';
import {
  Article,
  Category,
  ModerationRule,
  MODERATION_ACTION_ACCEPT,
  ModeratorAssignment,
  Preselect,
  Tag,
  TaggingSensitivity,
  User,
  UserCategoryAssignment,
} from '../../../models';
import {
  clearInterested,
  partialUpdateHappened,
  registerInterest,
  updateHappened,
} from '../../../notification_router';
import {
  makeArticle,
  makeCategory,
  makeTag,
  makeUser,
} from '../../fixture';

const assert = chai.assert;

async function awaitNotification(action: () => Promise<void>): Promise<Array<boolean>> {
  let notifyHappened = false;
  let notifyPartialHappened = false;
  let id: NodeJS.Timer;

  const timeout = new Promise((_, reject) => {
    id = setTimeout(() => {
      reject('Timed out while waiting for notification');
    }, 1000);
  });

  const notification = new Promise<void>((resolve, _) => {
    registerInterest({
      updateHappened: async () => {
        notifyHappened = true;
        resolve();
      },
      partialUpdateHappened: async (_articleId: number) => {
        notifyPartialHappened = true;
        resolve();
      },
    });
  });

  await action();

  await Promise.race([
    timeout,
    notification,
  ]);
  clearTimeout(id!);
  clearInterested();
  return [notifyHappened, notifyPartialHappened];
}

describe('Notification tests', () => {
  beforeEach(async () => {
    await Article.destroy({where: {}});
    await Category.destroy({where: {}});
    await User.destroy({where: {}});
    await Tag.destroy({where: {}});
    await TaggingSensitivity.destroy({where: {}});
    await ModerationRule.destroy({where: {}});
    await Preselect.destroy({where: {}});
    await UserCategoryAssignment.destroy({where: {}});
    await ModeratorAssignment.destroy({where: {}});
  });

  afterEach(clearInterested);

  it('Test notifier directly', async () => {
    const res = await awaitNotification(async () => {
      await updateHappened();
    });
    assert.isTrue(res[0]);
    assert.isFalse(res[1]);
  });

  it('Test partial notifier directly', async () => {
    const res = await awaitNotification(async () => {
      await partialUpdateHappened(0);
    });
    assert.isFalse(res[0]);
    assert.isTrue(res[1]);
  });

  it('Test notifier when denormalisation happens', async () => {
    const article = await makeArticle();

    const res = await awaitNotification(async () => {
      await denormalizeCommentCountsForArticle(article, false);
    });

    assert.isFalse(res[0]);
    assert.isTrue(res[1]);
  });

  it('Test notifier when denormalisation happens (this time with a category)', async () => {
    const category = await makeCategory();
    const article = await makeArticle({categoryId: category.id} );

    const res = await awaitNotification(async () => {
      await denormalizeCommentCountsForArticle(article, false);
    });

    assert.isFalse(res[0]);
    assert.isTrue(res[1]);
  });

  it('Test category assignment', async () => {
    const category = await makeCategory();
    await makeArticle({categoryId: category.id} );
    const user = await makeUser();

    const res = await awaitNotification(async () => {
      await updateCategoryAssignments(category.id, [user.id]);
    });

    assert.isTrue(res[0]);
    assert.isFalse(res[1]);
  });

  it('Test article assignment', async () => {
    const category = await makeCategory();
    const article = await makeArticle({categoryId: category.id} );
    const user = await makeUser();

    const res = await awaitNotification(async () => {
      await updateArticleAssignments(article.id, new Set([user.id]));
    });

    assert.isFalse(res[0]);
    assert.isTrue(res[1]);
  });

  it('Test notifies when user updated', async () => {
    let user: User;

    const res = await awaitNotification(async () => {
      user = await makeUser();
    });
    assert.isTrue(res[0]);
    assert.isFalse(res[1]);

    const res2 = await awaitNotification(async () => {
      user.update({
        name: 'newname',
      });
    });
    assert.isTrue(res2[0]);
    assert.isFalse(res2[1]);

    const res3 = await awaitNotification(async () => {
      user.destroy();
    });
    assert.isTrue(res3[0]);
    assert.isFalse(res3[1]);
  });

  it('Test notifies when tag updated', async () => {

    const res = await awaitNotification(async () => {
      await createTagObject({
        key: 'test',
        label: 'Test',
        color: '#FFFFFF',
      });
    });
    assert.isTrue(res[0]);
    assert.isFalse(res[1]);

    const tag = await Tag.findOne();

    const res2 = await awaitNotification(async () => {
      await modifyTagObject(tag!.id, {
        label: 'newname',
      });
    });
    assert.isTrue(res2[0]);
    assert.isFalse(res2[1]);

    const res3 = await awaitNotification(async () => {
      await deleteRangeObject('tag', tag!.id);
    });
    assert.isTrue(res3[0]);
    assert.isFalse(res3[1]);
  });

  it('Test notifies when taggingSensitivity updated', async () => {
    const res = await awaitNotification(async () => {
      await createRangeObject('tagging_sensitivity', {
        lowerThreshold: 0,
        upperThreshold: 1,
      });
    });
    assert.isTrue(res[0]);
    assert.isFalse(res[1]);

    const ts = await TaggingSensitivity.findOne();

    const res2 = await awaitNotification(async () => {
      await modifyRangeObject('tagging_sensitivity', ts!.id, {
        lowerThreshold: 0.5,
      });
    });
    assert.isTrue(res2[0]);
    assert.isFalse(res2[1]);

    const res3 = await awaitNotification(async () => {
      await deleteRangeObject('tagging_sensitivity', ts!.id);
    });
    assert.isTrue(res3[0]);
    assert.isFalse(res3[1]);
  });

  it('Test notifies when rule updated', async () => {
    const t = await makeTag();

    const res = await awaitNotification(async () => {
      await createRangeObject('moderation_rule', {
        tagId: t.id,
        action: MODERATION_ACTION_ACCEPT,
        lowerThreshold: 0,
        upperThreshold: 1,
      });
    });
    assert.isTrue(res[0]);
    assert.isFalse(res[1]);

    const mr = await ModerationRule.findOne();

    const res2 = await awaitNotification(async () => {
      await modifyRangeObject('moderation_rule', mr!.id, {
        lowerThreshold: 0.5,
      });
    });
    assert.isTrue(res2[0]);
    assert.isFalse(res2[1]);

    const res3 = await awaitNotification(async () => {
      await deleteRangeObject('moderation_rule', mr!.id);
    });
    assert.isTrue(res3[0]);
    assert.isFalse(res3[1]);
  });

  it('Test notifies when preselect updated', async () => {
    const res = await awaitNotification(async () => {
      await createRangeObject('preselect', {
        lowerThreshold: 0,
        upperThreshold: 1,
      });
    });
    assert.isTrue(res[0]);
    assert.isFalse(res[1]);

    const ps = await Preselect.findOne();

    const res2 = await awaitNotification(async () => {
      await modifyRangeObject('preselect', ps!.id, {
        lowerThreshold: 0.5,
      });
    });
    assert.isTrue(res2[0]);
    assert.isFalse(res2[1]);

    const res3 = await awaitNotification(async () => {
      await deleteRangeObject('preselect', ps!.id);
    });
    assert.isTrue(res3[0]);
    assert.isFalse(res3[1]);
  });
});
