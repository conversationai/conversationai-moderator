/*
Copyright 2020 Google Inc.

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

import * as chai from 'chai';

import {
  ICategoryInstance,
  IModerationRuleInstance, IPreselectInstance, ITaggingSensitivityInstance,
  ITagInstance, ModerationRule, Preselect,
  Tag, TaggingSensitivity,
} from '../../../models';
import {
  expect, makeCategory, makePreselect, makeRule,
  makeTag, makeTaggingSensitivity,
} from '../../fixture';
import {app} from './test_helper';

const BASE_URL = `/services/simple`;

describe(BASE_URL, () => {
  let category: ICategoryInstance;
  let tag1: ITagInstance;
  let tag2: ITagInstance;
  let deleteTag: ITagInstance;
  let rule: IModerationRuleInstance;
  let sensitivity: ITaggingSensitivityInstance;
  let preselect: IPreselectInstance;

  before(async () => {
    category = await makeCategory();
    tag1 = await makeTag({key: 'tag1', label: 'tag1'});
    tag2 = await makeTag({key: 'tag2', label: 'tag2'});
    deleteTag = await makeTag({key: 'deletetag', label: 'Delete tag'});
    rule = await makeRule(tag2);
    sensitivity = await makeTaggingSensitivity({tagId: tag2.id});
    preselect = await makePreselect({tagId: tag2.id});
  });

  after(async () => {
    await Tag.destroy({where: {}});
  });

  describe('tag operations', () => {
    it('post', async () => {
      const apiClient = chai.request(app);
      const {status} = await apiClient.post(`${BASE_URL}/tag`).send({
        color: '#ffffff',
        key: 'newtag',
        label: 'new tag',
      });
      expect(status).to.equal(200);
      const tags = await Tag.findAll();
      expect(tags.length).to.equal(4);
      expect(tags[3].key).to.equal('newtag');
      expect(tags[3].color).to.equal('#ffffff');
    });

    it('patch', async () => {
      const apiClient = chai.request(app);
      const {status} = await apiClient.patch(`${BASE_URL}/tag/${tag1.id}`).send({
        label: 'updated tag',
        isInBatchView: false,
        isTaggable: true,
      });
      expect(status).to.equal(200);
      const tag = await Tag.findByPk(tag1.id);
      expect(tag?.label).to.equal('updated tag');
      expect(tag?.isInBatchView).to.be.false;
      expect(tag?.isTaggable).to.be.true;
    });

    it('delete', async () => {
      const apiClient = chai.request(app);
      const {status} = await apiClient.del(`${BASE_URL}/tag/${deleteTag.id}`);
      expect(status).to.equal(200);
      const tags = await Tag.findAll();
      expect(tags.length).to.equal(3);
    });
  });

  describe('moderation rule', () => {
    it('create', async () => {
      const apiClient = chai.request(app);
      const {status} = await apiClient.post(`${BASE_URL}/moderation_rule`).send({
        tagId: tag2.id,
        categoryId: category.id,
        lowerThreshold: 0,
        upperThreshold: 0.1,
        action: 'Accept',
      });
      expect(status).to.equal(200);
      const rules = await ModerationRule.findAll();
      expect(rules.length).to.equal(2);
      expect(rules[1].categoryId).to.equal(category.id);
      expect(rules[1].tagId).to.equal(tag2.id);
      expect(rules[1].action).to.equal('Accept');
      expect(rules[1].lowerThreshold).to.equal(0);
    });

    it('update', async () => {
      const apiClient = chai.request(app);
      const {status} = await apiClient.patch(`${BASE_URL}/moderation_rule/${rule.id}`).send({
        tagId: tag1.id,
        upperThreshold: 0.2,
        action: 'Reject',
      });
      expect(status).to.equal(200);
      const newRule = await ModerationRule.findByPk(rule.id);
      expect(newRule?.categoryId).to.equal(null);
      expect(newRule?.tagId).to.equal(tag1.id);
      expect(newRule?.action).to.equal('Reject');
      expect(newRule?.lowerThreshold).to.equal(0);
      expect(newRule?.upperThreshold).to.equal(0.2);
    });

    it('delete', async () => {
      const apiClient = chai.request(app);
      const {status} = await apiClient.del(`${BASE_URL}/moderation_rule/${rule.id}`);
      expect(status).to.equal(200);
      const rules = await ModerationRule.findAll();
      expect(rules.length).to.equal(1);
    });
  });

  describe('sensitivities', () => {
    it('create', async () => {
      const apiClient = chai.request(app);
      const {status} = await apiClient.post(`${BASE_URL}/tagging_sensitivity`).send({
        tagId: tag2.id,
        lowerThreshold: 0,
        upperThreshold: 0.1,
      });
      expect(status).to.equal(200);
      const sensitivities = await TaggingSensitivity.findAll();
      expect(sensitivities.length).to.equal(2);
      expect(sensitivities[1].categoryId).to.equal(null);
      expect(sensitivities[1].tagId).to.equal(tag2.id);
      expect(sensitivities[1].lowerThreshold).to.equal(0);
    });

    it('update', async () => {
      const apiClient = chai.request(app);
      const {status} = await apiClient.patch(`${BASE_URL}/tagging_sensitivity/${sensitivity.id}`).send({
        categoryId: category.id,
        tagId: null,
        upperThreshold: 0.2,
      });
      expect(status).to.equal(200);
      const newSensitivity = await TaggingSensitivity.findByPk(sensitivity.id);
      expect(newSensitivity?.categoryId).to.equal(category.id);
      expect(newSensitivity?.tagId).to.equal(null);
      expect(newSensitivity?.lowerThreshold).to.equal(0);
      expect(newSensitivity?.upperThreshold).to.equal(0.2);
    });

    it('delete', async () => {
      const apiClient = chai.request(app);
      const {status} = await apiClient.del(`${BASE_URL}/tagging_sensitivity/${sensitivity.id}`);
      expect(status).to.equal(200);
      const sensitivities = await TaggingSensitivity.findAll();
      expect(sensitivities.length).to.equal(1);
    });
  });

  describe('preselect', () => {
    it('create', async () => {
      const apiClient = chai.request(app);
      const {status} = await apiClient.post(`${BASE_URL}/preselect`).send({
        lowerThreshold: 0,
        upperThreshold: 0.1,
      });
      expect(status).to.equal(200);
      const preselects = await Preselect.findAll();
      expect(preselects.length).to.equal(2);
      expect(preselects[1].categoryId).to.equal(null);
      expect(preselects[1].tagId).to.equal(null);
      expect(preselects[1].lowerThreshold).to.equal(0);
    });

    it('update', async () => {
      const apiClient = chai.request(app);
      const {status} = await apiClient.patch(`${BASE_URL}/preselect/${preselect.id}`).send({
        tagId: tag2.id,
        categoryId: category.id,
        upperThreshold: 0.2,
      });
      expect(status).to.equal(200);
      const newPreselect = await Preselect.findByPk(preselect.id);
      expect(newPreselect?.categoryId).to.equal(category.id);
      expect(newPreselect?.tagId).to.equal(tag2.id);
      expect(newPreselect?.lowerThreshold).to.equal(0);
      expect(newPreselect?.upperThreshold).to.equal(0.2);
    });

    it('delete', async () => {
      const apiClient = chai.request(app);
      const {status} = await apiClient.del(`${BASE_URL}/preselect/${preselect.id}`);
      expect(status).to.equal(200);
      const preselects = await Preselect.findAll();
      expect(preselects.length).to.equal(1);
    });
  });
});
