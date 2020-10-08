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

import { createToken } from '../../auth/tokens';
import { clearError } from '../../integrations';
import {
  Article,
  Comment,
  CommentFlag,
  CommentScore,
  CommentSummaryScore,
  ICommentInstance,
  ICommentScoreAttributes,
  ModerationRule,
  Preselect,
  Tag,
  TaggingSensitivity,
  User,
  USER_GROUP_ADMIN,
  USER_GROUP_GENERAL,
  USER_GROUP_SERVICE,
  USER_GROUP_YOUTUBE,
} from '../../models';
import {
  partialUpdateHappened,
  updateHappened,
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

  router.get('/systemUsers/:type', async (req, res, next) => {
    const users = await User.findAll({
      where: { group: req.params.type },
    });

    const userdata: Array<any> = [];
    for (const u of users) {
      const simple = u.toJSON();
      if (req.params.type === USER_GROUP_SERVICE) {
        const token = await createToken(u.id);
        simple.extra = {jwt: token};
      }
      else if (u.extra) {
        simple.extra = u.extra as object;
        // Make sure we don't send any access tokens out.
        delete simple.extra.token;
      }
      userdata.push(pick(simple, userFields));
    }

    res.json({ users: userdata });

    next();
  });

  router.post('/user/update/:id', async (req, res, next) => {
    const userId = parseInt(req.params.id, 10);
    const user = await User.findByPk(userId);
    if (!user) {
      res.status(404).send('Not found');
      next();
      return;
    }

    const group = user.group;

    function isRealUser(g: string) {
      return g === USER_GROUP_ADMIN || g === USER_GROUP_GENERAL;
    }

    if (isRealUser(group) || group === USER_GROUP_SERVICE) {
      user.name = req.body.name;
    }
    if (isRealUser(group)) {
      if (isRealUser(req.body.group)) {
        user.group = req.body.group;
      }
      user.email = req.body.email;
    }
    user.isActive = req.body.isActive;
    await user.save();

    if (group === USER_GROUP_YOUTUBE && req.body.isActive) {
      await clearError(user);
    }

    res.json(REPLY_SUCCESS);
    updateHappened();
    next();
  });

  router.post('/article/update/:id', async (req, res, next) => {
    const articleId = parseInt(req.params.id, 10);
    const article = await Article.findByPk(articleId);
    if (!article) {
      res.status(404).json({status: 'error', errors: 'article not found'});
      next();
      return;
    }

    article.isCommentingEnabled = req.body.isCommentingEnabled;
    article.isAutoModerated = req.body.isAutoModerated;
    await article.save();

    res.json(REPLY_SUCCESS);
    partialUpdateHappened(articleId);
    next();
  });

  router.post('/article/get', async (req, res, next) => {
    const articles = await Article.findAll({
      where: {id: {[Op.in]: req.body}},
      include: [{ model: User, as: 'assignedModerators', attributes: ['id']}],
    });
    const articleData = articles.map((a) => serialiseObject(a, ARTICLE_FIELDS));
    res.json(articleData);
    next();
  });

  router.post('/comment/get', async (req, res, next) => {
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
    ) as Array<ICommentScoreAttributes>;

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
        data['replies'] = ((c as any).replies as Array<ICommentInstance>).map((r) => r.id.toString());
      }
      const scoreData = scoresMap.get(c.id);
      if (scoreData) {
        data['summaryScores'] = scoreData;
      }
      return data;
    });

    res.json(commentData);
    next();
  });

  router.get('/article/:id/text', async (req, res, next) => {
    const articleId = parseInt(req.params.id, 10);
    const article = await Article.findByPk(articleId);
    if (!article) {
      res.status(404).send('Not found');
      next();
      return;
    }
    const text = article.text;
    res.json({text: text});
    next();
  });

  router.get('/comment/:id/scores', async (req, res, next) => {
    const commentId = parseInt(req.params.id, 10);
    const scores = await CommentScore.findAll({
      where: {commentId: commentId},
    });
    const scoresData = scores.map((s) => serialiseObject(s, SCORE_FIELDS));
    res.json(scoresData);
    next();
  });

  router.get('/comment/:id/flags', async (req, res, next) => {
    const commentId = parseInt(req.params.id, 10);
    const flags = await CommentFlag.findAll({
      where: {commentId: commentId},
    });
    const flagsData = flags.map((f) => serialiseObject(f, FLAG_FIELDS));
    res.json(flagsData);
    next();
  });

  router.delete('/:model/:id', async (req, res, next) => {
    const objectId = parseInt(req.params.id, 10);
    switch (req.params.model) {
      case 'moderation_rules':
        await ModerationRule.destroy({where: {id: objectId}});
        break;
      case 'preselects':
        await Preselect.destroy({where: {id: objectId}});
        break;
      case 'tagging_sensitivities':
        await TaggingSensitivity.destroy({where: {id: objectId}});
        break;
      case 'tags':
        await Tag.destroy({where: {id: objectId}});
        break;
    }
    updateHappened();
    res.json(REPLY_SUCCESS);
    next();
  });
  return router;
}
