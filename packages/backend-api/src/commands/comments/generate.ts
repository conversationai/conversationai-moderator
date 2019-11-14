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
import { Op } from 'sequelize';
import * as yargs from 'yargs';

import { logger } from '../../logger';
import { Article, Category, Comment, IAuthorAttributes, RESET_COUNTS, updateHappened } from '../../models';
import { postProcessComment, sendForScoring } from '../../pipeline';

const PREEXISTING_CATEGORIES = 5;
const PREEXISTING_ARTICLES = 20;
const NEW_CATEGORIES = 1;
const NEW_ARTICLES = 5;
const NEW_COMMENTS = 20;

export const command = 'comments:generate';
export const describe = 'Generate some comments, with some associated categories and articles.  ' +
  `We generate ${NEW_CATEGORIES} categories, ` +
  `${NEW_ARTICLES * NEW_CATEGORIES} articles and ` +
  `${NEW_COMMENTS * NEW_ARTICLES * NEW_CATEGORIES} comments per invocation.  ` +
  'Comments are spread across new categories/articles and last few existing ones';

export function builder(args: yargs.Argv) {
  return args
    .usage('Usage: node $0 comments:generate [ --categories c ] [ -articles a ] \n' +
           '                                 [ -comments o ]')
    .number('categories')
    .describe('categories', `Number of categories to create.`)
    .default('categories', NEW_CATEGORIES)
    .number('articles')
    .describe('articles', `Number of articles to create for each category.`)
    .default('articles', NEW_ARTICLES)
    .number('comments')
    .describe('comments', `Number of comments to create for each article.`)
    .default('comments', NEW_COMMENTS);
}

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

function get_words(data: string, count: number): string {
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

export async function handler(argv: any) {
  const data = fs.readFileSync(path.join(__dirname, '../../../data/alice.txt'), 'UTF8');

  const categories = await Category.findAll({
    where: {
      isActive: true,
      ownerId: {[Op.eq]: null},
    },
    order: [['createdAt', 'DESC']],
    limit: PREEXISTING_CATEGORIES,
  });

  const articles = await Article.findAll({
    where: {
      ownerId: {[Op.eq]: null},
    },
    order: [['createdAt', 'DESC']],
    limit: PREEXISTING_ARTICLES,
  });

  async function generate_comments() {
    for (let i = 0; i < argv.comments; i++) {
      const idx = Math.floor(articles.length * Math.random());
      const article = articles[idx];

      const author: IAuthorAttributes = {
        name: get_words(data, 3),
      };

      const comment = await Comment.create({
        sourceId: guid(),
        sourceCreatedAt: new Date(Date.now()),
        articleId: article.id,
        authorSourceId: guid(),
        author: author,
        text: get_sentences(data, 6),
      });

      await postProcessComment(comment);
      await sendForScoring(comment);
    }
  }

  async function generate_articles() {
    for (let i = 0; i < argv.articles; i++) {
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
        ...RESET_COUNTS,
      });

      logger.info(`Generated article ${new_article.id}: ${new_article.title}`);
      articles.push(new_article);
      await generate_comments();
    }
  }

  if (argv.categories !== 0) {
    for (let i = 0; i < argv.categories; i++) {
      const new_category = await Category.create({
        label: get_words(data, 5),
        ...RESET_COUNTS,
      });

      logger.info(`Generated category ${new_category.id}: ${new_category.label}`);
      categories.push(new_category);

      if (argv.articles !== 0) {
        await generate_articles();
      }
      else {
        await generate_comments();
      }
    }
  }
  else if (argv.articles !== 0) {
    await generate_articles();
  }
  else {
    await generate_comments();
  }

  if (argv.comments === 0) {
    logger.info(`Not generating comments, but trigger update anyway.`);
    await updateHappened();
  }
}
