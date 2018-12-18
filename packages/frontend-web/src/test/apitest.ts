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

// Set up config before importing as config variables are set during import
(global as any)['osmod_config'] = {
  API_URL: process.env['API_URL'],
};

import { decodeToken, setAxiosToken } from '../app/auth/store';
import { connectNotifier } from '../app/platform/dataService';
import { saveToken } from '../app/platform/localStore';
import { globalUpdate, systemUpdate, userUpdate } from './notificationChecks';

const token = process.argv[2];
if (!token) {
  console.log('You need to specify a token.');
  process.exit(1);
}

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

function websocketStateHandler(status: string): void {
  console.log(`WebSocket state change.  New status: ${status}`);
}

connectNotifier(
  websocketStateHandler,
  systemUpdate.notificationHandler,
  globalUpdate.notificationHandler,
  userUpdate.notificationHandler,
);

setTimeout(() => {
  systemUpdate.stateCheck();
  globalUpdate.stateCheck();
  userUpdate.stateCheck();
  console.log('shutting down.');
  process.exit(0);
}, 10000);
