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

import * as parse from 'csv-parse';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import * as yargs from 'yargs';
import {User} from '../../models';
import {createArticle, createCategory, createComment, createOwner} from './data_helpers';

export const command = 'comments:import';
export const describe = 'Import a CSV file of comments';

const FILES = ['brexit',  'climate',  'election',  'wikipedia'];

export function builder(args: yargs.Argv) {
  return args
    .usage('Usage: node $0 comments:import [ --source <source> ]')
    .choices('source', [...FILES, 'all'])
    .describe('source', 'Source of comments.')
    .default('source', 'all');
}

const METADATA = {
  wikipedia: {
    category: 'Wikipedia',
    article_id: '787',
    article_title: 'Wikipedia 1/9/17',
    article_summary: 'Some comments from Wikipedia.',
  },
  brexit: {
    category: 'Brexit',
    article_title: 'Brexit 9/1/2017',
    article_summary: 'Some thoughts about brexit...',
  },
  climate: {
    category: 'Climate Change',
    article_title: 'Climate Change 3/10/18',
    article_summary: 'Some thoughts about climate change...',
  },
  election: {
    category: 'US Election',
    article_title: 'US Election 10/20/17',
    article_summary: 'Some thoughts about the US election...',
  },
} as {[key: string]: {category: string, article_title: string, article_summary: string}};

async function processFile(owner: User, fname: string) {
  const metadata = METADATA[fname];
  const category = await createCategory(owner, metadata.category);
  const article = await createArticle(category, metadata.article_title,
    metadata.article_summary, 'https://jigsaw.google.com/');
  const content = await fsPromises.readFile(path.join(__dirname, `../../../data/${fname}.csv`), 'utf8');
  const records = parse(content, {from_line: 2});
  for await (const record of records) {
    await createComment(article, `${fname} user`, record[0]);
  }
}

export async function handler(argv: any) {
  const owner = await createOwner('csv service user');

  if (argv.source === 'all') {
    for (const f of FILES) {
      await processFile(owner, f);
    }
  } else {
    await processFile(owner, argv.source);
  }
}
