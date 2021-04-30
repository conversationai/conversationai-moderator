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
 * We use this module for API endpoints where it is easier to implement a custom interface
 * than to modify/customise/configure the generic REST api to do the same thing.
 */

import * as express from 'express';
import { pick } from 'lodash';
import { Op, QueryTypes } from 'sequelize';

import {
  checkModelType,
  createRangeObject,
  createTagObject,
  deleteRangeObject,
  modifyRangeObject,
  modifyTagObject,
} from '../../actions/object_updaters';
import { createToken } from '../../auth/tokens';
import { clearError } from '../../integrations';
import {
  Article,
  Comment,
  CommentFlag,
  CommentScore,
  CommentSummaryScore,
  User,
  USER_GROUP_ADMIN,
  USER_GROUP_GENERAL,
  USER_GROUP_SERVICE,
  USER_GROUP_YOUTUBE,
} from '../../models';
import { sequelize } from '../../sequelize';
import { REPLY_SUCCESS } from '../constants';
import {
  ARTICLE_FIELDS,
  COMMENT_FIELDS,
  FLAG_FIELDS,
  SCORE_FIELDS,
  serialiseObject,
  serializedData,
  SUMMARY_SCORE_FIELDS,
} from './serializer';

const userFields = ['id', 'name', 'email', 'group', 'isActive', 'extra'];

export function createSimpleRESTService(): express.Router {
  const router = express.Router({
    caseSensitive: true,
    mergeParams: true,
  });

  router.get('/systemUsers/:type', async (req, res) => {
    const users = await User.findAll({
      where: { group: req.params.type },
    });

    const userdata: Array<any> = [];
    for (const u of users) {
      const simple = u.toJSON() as {[key: string]: any};
      if (req.params.type === USER_GROUP_SERVICE) {
        const token = await createToken(u.id);
        simple.extra = {jwt: token};
      }
      else if (u.extra) {
        simple.extra = u.extra;
        // Make sure we don't send any access tokens out.
        delete simple.extra.token;
      }
      userdata.push(pick(simple, userFields));
    }

    res.json({ users: userdata });
  });

  router.post('/user',  async (req, res) => {
    const {name, email, group, isActive} = req.body;
    if (!(group === USER_GROUP_ADMIN || group === USER_GROUP_GENERAL || group === USER_GROUP_SERVICE)) {
      res.status(400).send(`Can't create users of type ${group}`);
      return;
    }

    if ((group === USER_GROUP_ADMIN || group === USER_GROUP_GENERAL) && !email) {
      res.status(400).send('User creation error: Human users require an email.');
      return;
    }

    if (email) {
      const existing = await User.count({where: {email}});
      if (existing) {
        res.status(400).send('User creation error: email already in use.');
        return;
      }
    }

    await User.create({name, email, group, isActive});

    res.json(REPLY_SUCCESS);
  });

  router.post('/user/:id', async (req, res) => {
    const userId = parseInt(req.params.id, 10);
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).send('Not found');
      return;
    }

    const group = user.group;

    function isRealUser(g: string) {
      return g === USER_GROUP_ADMIN || g === USER_GROUP_GENERAL;
    }

    if ((isRealUser(group) || group === USER_GROUP_SERVICE) && typeof(req.body.name) !== 'undefined') {
      user.name = req.body.name;
    }

    if (isRealUser(group)) {
      if (isRealUser(req.body.group)) {
        user.group = req.body.group;
      }

      if (typeof(req.body.email) !== 'undefined') {
        user.email = req.body.email;
      }
    }

    if (typeof(req.body.isActive) !== 'undefined') {
      user.isActive = req.body.isActive;
    }
    await user.save();

    if (group === USER_GROUP_YOUTUBE && req.body.isActive) {
      await clearError(user);
    }

    res.json(REPLY_SUCCESS);
  });

  router.post('/article/:id', async (req, res) => {
    const articleId = parseInt(req.params.id, 10);
    const article = await Article.findByPk(articleId);
    if (!article) {
      res.status(404).json({status: 'error', errors: 'article not found'});
      return;
    }

    if (typeof req.body.isCommentingEnabled === 'boolean') {
      article.isCommentingEnabled = req.body.isCommentingEnabled;
    }
    if (typeof req.body.isAutoModerated === 'boolean') {
      article.isAutoModerated = req.body.isAutoModerated;
    }

    await article.save();

    res.json(REPLY_SUCCESS);
  });

  router.post('/articles', async (req, res) => {
    const articles = await Article.findAll({
      where: {id: {[Op.in]: req.body}},
      include: [{ model: User, as: 'assignedModerators', attributes: ['id']}],
    });
    const articleData = articles.map((a) => serialiseObject(a, ARTICLE_FIELDS));
    res.json(articleData);
  });

  router.post('/comments', async (req, res) => {
    const comments = await Comment.findAll({
      where: {id: {[Op.in]: req.body}},
      include: [
        {model: Article, as: 'article', attributes: ['categoryId']},
        {model: Comment, as: 'replies', attributes: ['id']},
      ],
    });
    const summaryScores = await CommentSummaryScore.findAll({
      where: {commentId: {[Op.in]: req.body}},
    });

    const results = await sequelize.query(
      'SELECT commentId, tagId, score, annotationStart, annotationEnd ' +
      'FROM comment_scores ' +
      'WHERE id IN (SELECT commentScoreId from comment_top_scores where commentId in (:commentIds))',
      {
        type: QueryTypes.SELECT,
        replacements: { commentIds: req.body },
      },
    ) as Array<CommentScore>;

    const topScores = new Map<string, {[key: string]: any}>();
    for (const topScore of results) {
      topScores.set(
        `${topScore.commentId}:${topScore.tagId}`,
        {score: topScore.score, start: topScore.annotationStart, end: topScore.annotationEnd},
      );
    }

    const scoresMap = new Map<number, Array<serializedData>>();
    for (const score of summaryScores) {
      let scoresForComment = scoresMap.get(score.commentId);
      if (!scoresForComment) {
        scoresForComment = [];
        scoresMap.set(score.commentId, scoresForComment);
      }
      const summaryScore = serialiseObject(score, SUMMARY_SCORE_FIELDS);
      const topScore = topScores.get(`${score.commentId}:${score.tagId}`);
      if (topScore) {
        summaryScore['topScore'] = topScore;
      }
      scoresForComment.push(summaryScore);
    }

    const commentData = comments.map((c) => {
      const data = serialiseObject(c, COMMENT_FIELDS);
      if ((c as any).article && (c as any).article.categoryId) {
        data['categoryId'] = (c as any).article.categoryId.toString();
      }
      if ((c as any).replies) {
        data['replies'] = ((c as any).replies as Array<Comment>).map((r) => r.id.toString());
      }
      const scoreData = scoresMap.get(c.id);
      if (scoreData) {
        data['summaryScores'] = scoreData;
      }
      return data;
    });

    res.json(commentData);
  });

  router.get('/article/:id/text', async (req, res) => {
    const articleId = parseInt(req.params.id, 10);
    const article = await Article.findByPk(articleId);
    if (!article) {
      res.status(404).send('Not found');
      return;
    }
    const text = article.text;
    res.json({text: text});
  });

  router.get('/comment/:id/scores', async (req, res) => {
    const commentId = parseInt(req.params.id, 10);
    const scores = await CommentScore.findAll({
      where: {commentId: commentId},
    });
    const scoresData = scores.map((s) => serialiseObject(s, SCORE_FIELDS));
    res.json(scoresData);
  });

  router.get('/comment/:id/flags', async (req, res) => {
    const commentId = parseInt(req.params.id, 10);
    const flags = await CommentFlag.findAll({
      where: {commentId: commentId},
    });
    const flagsData = flags.map((f) => serialiseObject(f, FLAG_FIELDS));
    res.json(flagsData);
  });

  router.post('/tag', async (req, res) => {
    const msg = await createTagObject(req.body);
    if (msg) {
      res.status(400).send(msg);
      return;
    }
    res.json(REPLY_SUCCESS);
  });

  router.patch('/tag/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const msg = await modifyTagObject(id, req.body);
    if (msg) {
      res.status(400).send(msg);
      return;
    }

    res.json(REPLY_SUCCESS);
  });

  router.post('/:model', async (req, res) => {
    if (!checkModelType(req.params.model)) {
      res.status(400).send('Bad object type');
      return;
    }

    const msg = await createRangeObject(req.params.model, req.body);
    if (msg) {
      res.status(400).send(msg);
      return;
    }

    res.json(REPLY_SUCCESS);
  });

  router.patch('/:model/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);

    if (!checkModelType(req.params.model)) {
      res.status(400).send('Bad object type');
      return;
    }

    const msg = await modifyRangeObject(req.params.model, id, req.body);
    if (msg) {
      res.status(400).send(msg);
      return;
    }
    res.json(REPLY_SUCCESS);
  });

  router.delete('/:model/:id', async (req, res) => {
    const objectId = parseInt(req.params.id, 10);
    if (!checkModelType(req.params.model) && req.params.model !== 'tag') {
      res.status(400).send('Bad object type');
      return;
    }

    await deleteRangeObject(req.params.model, objectId);
    res.json(REPLY_SUCCESS);
  });
  return router;
}
