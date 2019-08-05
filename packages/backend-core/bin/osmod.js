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
/**
 * Entrypoint for the osmod commandline tool.
 *
 * Provides commandline access to various features, including
 *  - managing users
 *  - inventing comments for test purposes
 *  - managing comments
 *
 *  For a full list of available commands, run `osmod.js --help`
 */

'use strict';

const path = require('path');
const yargs = require('yargs');

yargs
  .command(require(path.join(__dirname, '..', 'dist', 'commands', 'denormalize')))
  .command(require(path.join(__dirname, '..', 'dist', 'commands', 'exec')))
  .command(require(path.join(__dirname, '..', 'dist', 'commands', 'articles', 'delete')))
  .command(require(path.join(__dirname, '..', 'dist', 'commands', 'comments', 'recalculate_text_sizes')))
  .command(require(path.join(__dirname, '..', 'dist', 'commands', 'comments', 'calculate_text_size')))
  .command(require(path.join(__dirname, '..', 'dist', 'commands', 'comments', 'recalculate_top_scores')))
  .command(require(path.join(__dirname, '..', 'dist', 'commands', 'comments', 'delete')))
  .command(require(path.join(__dirname, '..', 'dist', 'commands', 'comments', 'flag')))
  .demand(1)
  .usage('Usage: $0')
  .help()
  .argv;
