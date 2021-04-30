#!/usr/bin/env node

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

'use strict';

const path = require('path');
const yargs = require('yargs');

const youtube = require(path.join(__dirname, '..', 'dist', 'commands', 'tests', 'youtube'));
const generate = require(path.join(__dirname, '..', 'dist', 'commands', 'comments', 'generate'));
const imprt = require(path.join(__dirname, '..', 'dist', 'commands', 'comments', 'import'));

yargs
  .command(youtube)
  .command(generate)
  .command(imprt)
  .demand(1)
  .demandCommand(1, 'no command specified')
  .usage('Usage: $0 <command> [options]')
  .help()
  .onFinishCommand(() => {process.exit()})
  .argv;
