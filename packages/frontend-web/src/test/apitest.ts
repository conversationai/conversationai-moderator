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

function usage() {
  console.log(`usage: node ${process.argv[1]} <api_url> <token>`);
  console.log(`   where api_url is the URL for the API backend (e.g., http://localhost:8080)`);
  console.log(`   and <token> is an access token for an OSMod user.  (As allocated by bin/osmod user:get-token)`);
}

const api_url = process.argv[2];
if (!api_url) {
  console.log('You need to specify an API URL.');
  usage();
  process.exit(1);
}

const token = process.argv[3];
if (!token) {
  console.log('You need to specify a token.');
  usage();
  process.exit(1);
}

// Set up config before importing as config variables are set during import
(global as any)['osmod_config'] = {
  API_URL: api_url,
};

import { decodeToken, setAxiosToken } from '../app/auth';
import { getArticles, setUserId } from '../app/platform/dataService';
import { saveToken } from '../app/platform/localStore';
import { connectNotifier } from '../app/platform/websocketService';
import { approveComment, rejectComment, setArticleModerators, setArticleState } from './actions';
import { articleData, systemData, userData } from './notificationChecks';
import { checkArrayOf, checkArticle } from './objectChecks';
import {
  commentDetailsPage,
  fetchArticleText,
  listModeratedCommentsPage,
  listNewCommentsPage_SUMMARY_SCORE,
} from './pageTests';

let userId: string;
try {
  const data = decodeToken(token);
  console.log(`Accessing osmod backend as user ${data.user}`);
  userId = data.user.toString();
}
catch (e) {
  console.log(`Couldn't parse token ${token}.`);
  process.exit(1);
}

saveToken(token);
setAxiosToken(token);
setUserId(userId);

(async () => {
  const readyPromise = new Promise<void>((resolve) => {
    function websocketStateHandler(status: string): void {
      console.log(`WebSocket state change.  New status: ${status}`);
      resolve();
    }

    connectNotifier(
      websocketStateHandler,
      systemData.notificationHandler,
      articleData.notificationHandler,
      articleData.updateHandler,
      userData.notificationHandler,
    );
  });

  await readyPromise;

  systemData.usersCheck();
  articleData.dataCheck();
  systemData.tagsCheck();

  console.log('* WebSocket State');
  systemData.stateCheck();
  articleData.stateCheck();
  userData.stateCheck();

  if (articleData.articlesWithNew.length > 0) {
    console.log('Trying out getArticles API');
    const articles = await getArticles(articleData.articlesWithNew.map((a) => (a.id)));
    checkArrayOf(checkArticle, articles);
  }

  if (articleData.articleFullyEnabled) {
    console.log('\n* Checking set article state');
    await setArticleState(articleData.articleFullyEnabled.id, true, false);
    await setArticleState(articleData.articleFullyEnabled.id, false, false);
    await setArticleState(articleData.articleFullyEnabled.id, true, true);
  }

  if (articleData.articleWithNoModerators) {
    console.log('\n* Checking set article moderators');
    await setArticleModerators(articleData.articleWithNoModerators.id, [systemData.users[0].id]);
    await setArticleModerators(articleData.articleWithNoModerators.id, systemData.users.map((u) => u.id));
    await setArticleModerators(articleData.articleWithNoModerators.id, []);
  }

  if (articleData.articlesWithFlags.length > 0 ) {
    const articles = articleData.articlesWithFlags;
    console.log('\n* Doing a flagged comment fetch');
    await listModeratedCommentsPage('flagged', 'all');
    console.log('  Checked all');
    const articlesWithCategory = articles.filter((a) => (!!a.categoryId));
    if (articlesWithCategory.length > 0) {
      await listModeratedCommentsPage('flagged', 'category', articlesWithCategory[0].categoryId);
      console.log(`  Checked category ${articlesWithCategory[0].categoryId}`);
    }
    const article = articles[0];
    const comments = await listModeratedCommentsPage('flagged', 'article', article.id);
    console.log(`  Checked article ${article.id}`);
    console.log(`  Found ${comments.length} flagged comments`);

    if (comments.length > 0) {
      const comment = comments[0];
      console.log(`  Doing a fetch of comment ${comment}`);
      await commentDetailsPage(comment);
      console.log(`  Doing comment action tests. `);
      const category = articleData.categories.get(article.categoryId);

      await rejectComment(comment, false, {
        rejectedCount: category.rejectedCount + 1,
        flaggedCount: category.flaggedCount - 1,
      }, {
        rejectedCount: article.rejectedCount + 1,
        flaggedCount: article.flaggedCount - 1,
      });

      await approveComment(comment, false,
        {
          rejectedCount: category.rejectedCount,
          flaggedCount: category.flaggedCount,
        }, {
          rejectedCount: article.rejectedCount,
          flaggedCount: article.flaggedCount,
        });

      await approveComment(comment, true,
        {
          flaggedCount: category.flaggedCount - 1,
        }, {
          flaggedCount: article.flaggedCount - 1,
        });

      await rejectComment(comment, true,
        {
          flaggedCount: category.flaggedCount - 1,
        }, {
          flaggedCount: article.flaggedCount - 1,
        });
    }
  }

  if (articleData.articlesWithNew.length > 0) {
    const articles = articleData.articlesWithNew;
    console.log('\n* Doing a new comment fetch');
    await listNewCommentsPage_SUMMARY_SCORE('all');
    console.log('  Checked all');
    const articlesWithCategory = articles.filter((a) => (!!a.categoryId));
    if (articlesWithCategory.length > 0) {
      await listNewCommentsPage_SUMMARY_SCORE('category', articlesWithCategory[0].categoryId);
      console.log(`  Checked category ${articlesWithCategory[0].categoryId}`);
    }

    const article = articles[0];
    const comments = await listNewCommentsPage_SUMMARY_SCORE('article', article.id);
    console.log(`  Checked article ${article.id}`);
    console.log('  Doing an article text fetch');
    await fetchArticleText(article.id);
    console.log(`\n* Approving comment ${comments.last()} and waiting for notification.`);

    const category = articleData.categories.get(article.categoryId);
    await approveComment(comments.last(), false,
      {
        approvedCount: category.approvedCount + 1,
      }, {
        approvedCount: article.approvedCount + 1,
      });
  }

  console.log('shutting down.');
  process.exit(0);
})();
