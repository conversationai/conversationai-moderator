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
import * as http from 'http';
import * as https from 'https';

import { destroyUpdateNotificationService } from './api/services/updateNotifications';

let server: https.Server | http.Server;
let init: () => void;
let closing = false;

export function registerServer(iserver: https.Server | http.Server) {
  server = iserver;
}

export function registerInit(iinit: () => void) {
  init = iinit;
}

export function restartService() {
  if (closing) {
    return;
  }
  closing = true;
  console.log('*** closing server');
  server.close(() => {
    closing = false;
    init();
  });
  destroyUpdateNotificationService();
}
