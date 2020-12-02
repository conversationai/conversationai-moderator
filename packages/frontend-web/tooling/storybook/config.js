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

import { addDecorator, configure } from "@storybook/react";
import React from "react";
import { Provider } from "react-redux";
import { store } from "../../src/app/store";

const withProvider = (story) => <Provider store={store}>{story()}</Provider>;
addDecorator(withProvider);

const req = require.context("../../src/app", true, /Story\.tsx?$/);

function loadStories() {
  req.keys().forEach(req);
}

configure(loadStories, module);
