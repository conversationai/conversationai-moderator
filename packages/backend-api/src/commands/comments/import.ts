/*
Copyright 2012 Google Inc.

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

import * as fs from 'fs';
import * as path from 'path';
import * as yargs from 'yargs';
import {IUserInstance, User, USER_GROUP_SERVICE} from '../../models';

export const command = 'comments:import';
export const describe = 'Import a CSV file of comments';

const FILES = ['all', 'brexit',  'climate',  'election',  'wikipedia'];

export function builder(args: yargs.Argv) {
  return args
    .usage('Usage: node $0 comments:generate [ --categories c ] [ -articles a ] \n' +
      '                                 [ -comments o ]')
    .choices('source', FILES)
    .describe('source', `Source of comments.  (Defaults to ${FILES[0]})`)
    .default('source', FILES[0]);
}


function processFile(_owner: IUserInstance, fname: string) {
  console.log(fname);
  fs.readFileSync(path.join(__dirname, `../../../data/${fname}.txt`), 'UTF8');
}

export async function handler(argv: any) {
  const [owner, ] = await User.findOrCreate({
    where: {name: 'csv service user'},
    defaults: {
      name: 'csv service user',
      group: USER_GROUP_SERVICE,
      isActive: true,
    },
  });

  if (argv.source === 'all') {
    for (const f of FILES) {
      processFile(owner, f);
    }
  } else {
    processFile(owner, argv.source);
  }
}
