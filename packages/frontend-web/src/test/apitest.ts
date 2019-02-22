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

import { decodeToken, setAxiosToken } from '../app/auth/store';
import { saveToken } from '../app/platform/localStore';
import { connectNotifier } from '../app/platform/websocketService';
import { globalUpdate, systemUpdate, userUpdate } from './notificationChecks';
import { commentDetailsPage,  listModeratedCommentsPage } from './pageTests';

try {
  const data = decodeToken(token);
  console.log(`Accessing osmod backend as user ${data.user}`);
}
catch (e) {
  console.log(`Couldn't parse token ${token}.`);
  process.exit(1);
}

saveToken(token);
setAxiosToken(token);

(async () => {
  const readyPromise = new Promise<void>((resolve) => {
    function websocketStateHandler(status: string): void {
      console.log(`WebSocket state change.  New status: ${status}`);
      resolve();
    }

    connectNotifier(
      websocketStateHandler,
      systemUpdate.notificationHandler,
      globalUpdate.notificationHandler,
      userUpdate.notificationHandler,
    );
  });

  await readyPromise;

  systemUpdate.usersCheck();
  globalUpdate.dataCheck();
  systemUpdate.tagsCheck();

  console.log('* WebSocket State');
  systemUpdate.stateCheck();
  globalUpdate.stateCheck();
  userUpdate.stateCheck();

  if (globalUpdate.articlesWithFlags.length > 0 ) {
    console.log('* Doing a flagged comment fetch');
    await listModeratedCommentsPage('flagged', 'all');
    console.log('  Checked all');
    const articlesWithCategory = globalUpdate.articlesWithFlags.filter((a) => (!!a.category));
    if (articlesWithCategory.length > 0) {
      await listModeratedCommentsPage('flagged', 'category', articlesWithCategory[0].category.id);
      console.log(`  Checked category ${articlesWithCategory[0].category.id}`);
    }
    const comments = await listModeratedCommentsPage('flagged', 'article', globalUpdate.articlesWithFlags[0].id);
    console.log(`  Checked article ${globalUpdate.articlesWithFlags[0].id}`);
    console.log(`  Found ${comments.length} flagged comments.  Doing a fetch of one of them`);
    await commentDetailsPage(comments[0]);
  }

  console.log('shutting down.');
  process.exit(0);
})();
