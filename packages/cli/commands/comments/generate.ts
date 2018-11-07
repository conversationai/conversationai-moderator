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

import * as fs from 'fs';
import * as path from 'path';
import * as yargs from 'yargs';

import { logger } from '@conversationai/moderator-backend-core';
import { Article, Category } from '@conversationai/moderator-backend-core';

export const command = 'comments:generate';
export const describe = 'Generate some comments, with some associated categories and articles.  ' +
  'We generate 1 category, 5 articles and 100 comments per invocation.  ' +
  'Comments are spread across new categories/articles and last few existing ones';

export function builder(yargs: yargs.Argv) {
  return yargs
    .usage('Usage: node $0 comments:generate');
}

const PREEXISTING_CATEGORIES = 5;
const PREEXISTING_ARTICLES = 5;
const NEW_CATEGORIES = 1;
const NEW_ARTICLES = 5;
// const NEW_COMMENTS = 100;

function guid() {
  function s4() {
    return Math.floor((1 + Math.random()) * 0x10000)
      .toString(16)
      .substring(1);
  }
  return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
}

function isAlnum(data: string, offset: number): boolean {
  const c = data.charCodeAt(offset);
  if ((c > 47) && (c <  58)) {
    return true;
  }
  if ((c > 64) && (c <  91)) {
    return true;
  }
  if ((c > 96) && (c < 123)) {
    return true;
  }
  return false;
}

function isInternalPunctuation(data: string, offset: number): boolean {
  if (' \t\n\r\v\'\,";-_'.indexOf(data.charAt(offset)) > -1) {
    return true;
  }
  return false;
}

function find_start_of_sentence(data: string, offset: number): number {
  while (offset > 0 && (isAlnum(data, offset) || isInternalPunctuation(data, offset))) {
    offset -= 1;
  }
  return offset + 1;
}

function find_end_of_sentence(data: string, offset: number): number {
  const len = data.length;
  while (offset < len && (isAlnum(data, offset) || isInternalPunctuation(data, offset))) {
    offset += 1;
  }
  return offset;
}

function find_start_of_word(data: string, offset: number): number {
  while (offset > 0 && isAlnum(data, offset)) {
    offset -= 1;
  }
  return offset + 1;
}

function find_end_of_word(data: string, offset: number): number {
  const len = data.length;
  while (offset < len && isAlnum(data, offset)) {
    offset += 1;
  }
  return offset;
}

function get_sentences(data: string, count: number): string {
  const start = Math.floor(data.length * Math.random());
  const offset = find_start_of_sentence(data, start);
  let end = start;
  do {
    end = find_end_of_sentence(data, end + 1);
    count--;
  } while (end < data.length && count > 0);

  const ret = data.substr(offset, end - offset).trim();
  if (ret.length === 0) {
    return get_words(data, count);
  }
  return ret;
}

function get_words(data: string, count: number): string{
  const start = Math.floor(data.length * Math.random());
  const offset = find_start_of_word(data, start);
  let end = start;
  do {
    end = find_end_of_word(data, end + 1);
    count--;
  } while (end < data.length && count > 0);

  const ret = data.substr(offset, end - offset).replace(/\W+/g, ' ').trim();
  if (ret.length === 0) {
    return get_words(data, count);
  }
  return ret;
}

export async function handler() {
  logger.info('Generating comments');
  const data = fs.readFileSync(path.join(__dirname, '../../data/alice.txt'), 'UTF8');

  const categories = await Category.findAll({
    where: {
      isActive: true,
      ownerId: {$eq: null},
    },
    order: [['createdAt', 'DESC']],
    limit: PREEXISTING_CATEGORIES,
  });

  const articles = await Article.findAll({
    where: {
      ownerId: {$eq: null},
    },
    order: [['createdAt', 'DESC']],
    limit: PREEXISTING_ARTICLES,
  });

  for (let i = 0; i < NEW_CATEGORIES; i++ ) {
    const new_category = await Category.create({
      label: get_words(data, 5),
    });

    logger.info(`Generated category ${new_category.id}: ${new_category.get('label')}`);
    categories.push(new_category);

    for (let i = 0; i < NEW_ARTICLES / NEW_CATEGORIES; i++) {
      const idx = Math.floor(categories.length * Math.random());
      const category = categories[idx];

      const new_article = await Article.create({
        categoryId: category.id,
        sourceId: guid(),
        title: get_words(data, 10),
        text: get_sentences(data, 3),
        url: 'https://archive.org/stream/alicesadventures19033gut/19033.txt',
        sourceCreatedAt: new Date(Date.now()),
        isCommentingEnabled: true,
        isAutoModerated: true,
      });

      logger.info(`Generated article ${new_article.id}: ${new_article.get('title')}`);
      articles.push(new_article);
    }
  }
}
