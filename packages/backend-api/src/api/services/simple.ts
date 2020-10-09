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
  IModerationRuleInstance,
  IPreselectInstance,
  ITaggingSensitivityInstance,
  MODERATION_RULE_ACTION_TYPES_SET,
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

  router.get('/systemUsers/:type', async (req, res) => {
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

    updateHappened();
    res.json(REPLY_SUCCESS);
  });

  router.post('/user/update/:id', async (req, res) => {
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
    updateHappened();
  });

  router.post('/article/update/:id', async (req, res) => {
    const articleId = parseInt(req.params.id, 10);
    const article = await Article.findByPk(articleId);
    if (!article) {
      res.status(404).json({status: 'error', errors: 'article not found'});
      return;
    }

    article.isCommentingEnabled = req.body.isCommentingEnabled;
    article.isAutoModerated = req.body.isAutoModerated;
    await article.save();

    res.json(REPLY_SUCCESS);
    partialUpdateHappened(articleId);
  });

  router.post('/article/get', async (req, res) => {
    const articles = await Article.findAll({
      where: {id: {[Op.in]: req.body}},
      include: [{ model: User, as: 'assignedModerators', attributes: ['id']}],
    });
    const articleData = articles.map((a) => serialiseObject(a, ARTICLE_FIELDS));
    res.json(articleData);
  });

  router.post('/comment/get', async (req, res) => {
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
    for (const k of ['color', 'key', 'label']) {
      if (typeof req.body[k] !== 'string') {
        res.status(400).send(`Tag creation error: Missing/invalid attribute ${k}.`);
        return;
      }
    }

    const {color, description, key, label, isInBatchView, inSummaryScore, isTaggable} = req.body;

    await Tag.create({
      color, description, key, label,
      isInBatchView: !!isInBatchView,
      inSummaryScore: !!inSummaryScore,
      isTaggable: !!isTaggable,
    });

    updateHappened();
    res.json(REPLY_SUCCESS);
  });

  router.patch('/tag/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    const tag = await Tag.findByPk(id);
    if (!tag) {
      res.status(404).send('Not found');
      return;
    }

    for (const k of ['color', 'key', 'label', 'description']) {
      if (k in req.body) {
        if (typeof req.body[k] !== 'string' && (k !== 'description' || req.body[k] !== null)) {
          res.status(400).send(`Tag modification error: Invalid attribute ${k}.`);
          return;
        }
        tag.set(k, req.body[k]);
      }
    }

    for (const k of ['isInBatchView', 'inSummaryScore', 'isTaggable']) {
      if (k in req.body) {
        tag.set(k as 'isInBatchView' | 'inSummaryScore' | 'isTaggable', !!req.body[k]);
      }
    }

    await tag.save();
    updateHappened();
    res.json(REPLY_SUCCESS);
  });

  async function processRangeData(
    req: express.Request,
    res: express.Response,
    setValue: (key: string, value: string | number | boolean | null) => void,
  ) {
    for (const k of ['tagId', 'categoryId']) {
      if (k in req.body) {
        let val: number | null;
        if (req.body[k] === null) {
          if (k === 'tagId' && req.params.model === 'moderation_rule') {
            res.status(400).send(`tagId must be set.`);
            return false;
          }
          val = null;
        } else {
          val = parseInt(req.body[k], 10);
          if (isNaN(val)) {
            res.status(400).send(`Invalid value ${req.body[k]} for field ${k}.`);
            return false;
          }
        }
        setValue(k, val);
      }
    }
    for (const k of ['lowerThreshold', 'upperThreshold']) {
      if (k in req.body) {
        const val = parseFloat(req.body[k]);
        if (isNaN(val) || val < 0 || val > 1) {
          res.status(400).send(`Range error: ${k} is not a valid number: ${req.body[k]}.`);
          return false;
        }
        setValue(k, val);
      }
    }
    if (req.params.model === 'moderation_rule') {
      if ('action' in req.body) {
        const action = req.body.action;
        if (!MODERATION_RULE_ACTION_TYPES_SET.has(action)) {
          res.status(400).send(`Unknown action: ${action}.`);
          return false;
        }

        setValue('action', action);
      }
    }

    return true;
  }

  router.post('/:model', async (req, res) => {
    const data: {[key: string]: string | number | boolean | null } = {};
    if (!await processRangeData(req, res, (key, value) => data[key] = value)) {
      return;
    }

    let mandatory_attributes = ['lowerThreshold', 'upperThreshold'];
    if (req.params.model === 'moderation_rule') {
      mandatory_attributes = [...mandatory_attributes, 'tagId', 'action'];
    }

    for (const k of mandatory_attributes) {
      if (!(k in data)) {
        res.status(400).send(`Missing mandatory attribute: ${k}.`);
        return;
      }
    }

    switch (req.params.model) {
      case 'moderation_rule':
        await ModerationRule.create(data as any);
        break;
      case 'preselect':
        await Preselect.create(data as any);
        break;
      case 'tagging_sensitivity':
        await TaggingSensitivity.create(data as any);
        break;
      default:
        res.status(404);
        return;
    }

    updateHappened();
    res.json(REPLY_SUCCESS);
  });

  router.patch('/:model/:id', async (req, res) => {
    const id = parseInt(req.params.id, 10);
    let object: IModerationRuleInstance | IPreselectInstance | ITaggingSensitivityInstance | null;
    switch (req.params.model) {
      case 'moderation_rule':
        object = await ModerationRule.findByPk(id);
        break;
      case 'preselect':
        object = await Preselect.findByPk(id);
        break;
      case 'tagging_sensitivity':
        object = await TaggingSensitivity.findByPk(id);
        break;
      default:
        res.status(404);
        return;
    }

    if (!object) {
      res.status(404).send('Not found');
      return;
    }

    if (await processRangeData(req, res, (key, value) => object!.set(key, value as any))) {
      await object.save();
      updateHappened();
      res.json(REPLY_SUCCESS);
    }
  });

  router.delete('/:model/:id', async (req, res) => {
    const objectId = parseInt(req.params.id, 10);
    switch (req.params.model) {
      case 'moderation_rule':
        await ModerationRule.destroy({where: {id: objectId}});
        break;
      case 'preselect':
        await Preselect.destroy({where: {id: objectId}});
        break;
      case 'tagging_sensitivity':
        await TaggingSensitivity.destroy({where: {id: objectId}});
        break;
      case 'tag':
        await Tag.destroy({where: {id: objectId}});
        break;
      default:
        res.status(404);
        return;
    }
    updateHappened();
    res.json(REPLY_SUCCESS);
  });
  return router;
}
