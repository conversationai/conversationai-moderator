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

// TODO: This unit test should really be in core.  But so much happens outside core that it isn't really possible.
//       Refactor required?

import * as chai from 'chai';

import {
  IModerationRuleInstance,
  IPreselectInstance,
  ITaggingSensitivityInstance,
  ITagInstance,
  IUserInstance,
} from '@conversationai/moderator-backend-core';
import {
  Article,
  Category,
  ModerationRule,
  Preselect,
  Tag,
  TaggingSensitivity,
  User,
} from '@conversationai/moderator-backend-core';
import {
  clearInterested,
  denormalizeCommentCountsForArticle,
  registerInterest,
  updateHappened,
} from '@conversationai/moderator-backend-core';

import {
  makeArticle,
  makeCategory, makePreselect, makeRule,
  makeTag,
  makeTaggingSensitivity,
  makeUser,
} from '../../test_helper';

const assert = chai.assert;

async function awaitNotification(action: () => Promise<void>): Promise<boolean> {
  let notifyHappened = false;
  let id: NodeJS.Timer;

  const timeout = new Promise((_, reject) => {
    id = setTimeout(() => {
      reject('Timed out while waiting for notification');
    }, 1000);
  });

  const notification = new Promise((resolve, _) => {
    registerInterest(() => {
      notifyHappened = true;
      resolve();
    });
  });

  await action();

  await Promise.race([
    timeout,
    notification,
  ]);
  clearTimeout(id!);
  clearInterested();
  return notifyHappened;
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
  });

  afterEach(clearInterested);

  it('Test notifier directly', async () => {
    assert.isTrue(await awaitNotification(async () => {
      await updateHappened();
    }));
  });

  it('Test notifier when denormalisation happens', async () => {
    const article = await makeArticle();

    assert.isTrue(await awaitNotification(async () => {
      await denormalizeCommentCountsForArticle(article, false);
    }));
  });

  it('Test notifier when denormalisation happens (this time with a category)', async () => {
    const category = await makeCategory();
    const article = await makeArticle({categoryId: category.id} );

    assert.isTrue(await awaitNotification(async () => {
      await denormalizeCommentCountsForArticle(article, false);
    }));
  });

  it('Test notifies when user updated', async () => {
    let user: IUserInstance;

    assert.isTrue(await awaitNotification(async () => {
      user = await makeUser();
    }));

    assert.isTrue(await awaitNotification(async () => {
      user.update({
        name: 'newname',
      });
    }));

    assert.isTrue(await awaitNotification(async () => {
      user.destroy();
    }));
  });

  it('Test notifies when tag updated', async () => {
    let tag: ITagInstance;

    assert.isTrue(await awaitNotification(async () => {
      tag = await makeTag();
    }));

    assert.isTrue(await awaitNotification(async () => {
      tag.update({
        label: 'newname',
      });
    }));

    assert.isTrue(await awaitNotification(async () => {
      tag.destroy();
    }));
  });

  it('Test notifies when taggingSensitivity updated', async () => {
    let ts: ITaggingSensitivityInstance;

    assert.isTrue(await awaitNotification(async () => {
      ts = await makeTaggingSensitivity();
    }));

    assert.isTrue(await awaitNotification(async () => {
      ts.update({
        lowerThreshold: 0.5,
      });
    }));

    assert.isTrue(await awaitNotification(async () => {
      ts.destroy();
    }));
  });

  it('Test notifies when rule updated', async () => {
    let mr: IModerationRuleInstance;
    const t = await makeTag();

    assert.isTrue(await awaitNotification(async () => {
      mr = await makeRule(t);
    }));

    assert.isTrue(await awaitNotification(async () => {
      mr.update({
        lowerThreshold: 0.5,
      });
    }));

    assert.isTrue(await awaitNotification(async () => {
      mr.destroy();
    }));
  });

  it('Test notifies when preselect updated', async () => {
    let ps: IPreselectInstance;

    assert.isTrue(await awaitNotification(async () => {
      ps = await makePreselect();
    }));

    assert.isTrue(await awaitNotification(async () => {
      ps.update({
        lowerThreshold: 0.5,
      });
    }));

    assert.isTrue(await awaitNotification(async () => {
      ps.destroy();
    }));
  });
});
