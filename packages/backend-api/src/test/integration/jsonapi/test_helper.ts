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

import * as chai from 'chai';
import * as express from 'express';

const chaiHttp = require('chai-http');

import { makeServer } from '@conversationai/moderator-backend-core';
import { omit } from 'lodash';
import {
  ArticleSerializer,
  CommentSerializer,
  UserSerializer,
} from '../../../api/util/serializers';

import {
  createModelRouter,
  MockHandler,
  toIdentifier,
} from '@conversationai/moderator-jsonapi';

import { fakeArticleModel, fakeCommentModel, fakeUserModel } from '@conversationai/moderator-frontend-web';

const serverStuff = makeServer(true);
const server: express.Application = serverStuff.app;

const fakeUsers = [];

for (let i = 0; i < 10; i++) {
  const data = (fakeUserModel() as any).toJS();
  data.type = 'users';
  fakeUsers.push(data);
}

const fakeComments = [];
const fakeArticles = [];

for (let i = 0; i < 20; i++) {
  const data = (fakeArticleModel() as any).toJS();
  data.type = 'articles';

  data.comments = [];

  for (let j = 0; j < 50; j++) {
    const commentData = (fakeCommentModel() as any).toJS();
    commentData.type = 'comments';
    commentData.state = Math.random() > 0.5 ? 'moderated' : 'new';
    commentData.articleId = data.id;
    commentData.article = toIdentifier(data);

    data.comments.push(toIdentifier(commentData));
    fakeComments.push(commentData);
  }

  fakeArticles.push(data);
}

export const serializers: {
  [key: string]: any;
} = {
  comments: new CommentSerializer('/comments'),
  articles: new ArticleSerializer('/articles'),
  users: new UserSerializer('/users'),
};

const mockHandler = new MockHandler({
  comments: fakeComments,
  articles: fakeArticles,
  users: fakeUsers,
}, serializers as any);

// Note we have to reduce numberOfKeys to take into account
// system attributes (id, updatedAt, links to other objects etc.)
const models: {
  [key: string]: any;
} = {
  comments: {
    all: fakeComments,
    spec: fakeComments[0],
    // id, type, article, replies, replyTo, commentScores
    numberOfKeys: Object.keys(fakeComments[0]).length - 6,
    include: ['article', 'articles'],
  },
  articles: {
    all: fakeArticles,
    spec: fakeArticles[0],
    // id, type, category, owner, comments, assignedModerators
    numberOfKeys: Object.keys(fakeArticles[0]).length - 6,
    include: ['comments', 'comments'],
  },
  // 'users': {
  //   all: fakeUsers,
  //   spec: fakeUsers[0],
  //   // id, type
  //   numberOfKeys: Object.keys(fakeUsers[0]).length - 2,
  // },
};

Object.keys(models).forEach((modelName) => {
  server.use(`/${modelName}`, createModelRouter(modelName, mockHandler, '/'));
});

chai.use(chaiHttp);

const expect = chai.expect;

export { server, expect, models };

export function hasJSONAPIDocumentForm(body: any) {
  expect(body['jsonapi']['version']).to.be.equal('1.0');
  expect(body['data']).to.exist;
}

export function isFullModel(model: any, resource: any, attrFields?: Array<string>, relFields?: Array<string>) {
  const keyLength = 4 + (model.include ? 1 : 0);
  expect(Object.keys(resource)).to.be.lengthOf(keyLength);

  let expectedAttributesLength = model.numberOfKeys;

  if (attrFields) {
    expectedAttributesLength = attrFields.length;
  } else if (relFields) {
    expectedAttributesLength = 0;
  }

  expect(Object.keys(resource.attributes))
      .to.be.lengthOf(expectedAttributesLength);
  expect(resource.links.self).to.be.equal(`/${model.spec.type}/${resource.id}`);

  if (
    model.include &&
    (!attrFields || (relFields && relFields[model.include[0]]))
  ) {
    const relationship = resource.relationships[model.include[0]];
    expect(relationship.links.self).to.be.equal(
      `/${model.spec.type}/${resource.id}/relationships/${model.include[0]}`,
    );
  }
}

export function isIdentifier(resource: any) {
  const keys = Object.keys(resource);
  expect(keys).to.be.lengthOf(2);
  expect(resource['id']).to.exist;
  expect(resource['type']).to.exist;
}

function getNormaliser(attr: string): (val: string) => any {
  if (attr === 'sourceCreatedAt') {
    return (val: string) => Date.parse(val);
  }

  return (val: string) => Number(val);
}

export function sharedTestHelper() {
  function basicSingleModel(res: any, ofModel: string) {
    expect(res).to.have.status(200);
    expect(res).to.be.json;

    // Has standard info.
    hasJSONAPIDocumentForm(res.body);

    expect(res.body['data']).to.be.an('object');

    expect(res.body['data']['type']).to.be.equal(ofModel);
    isFullModel(models[ofModel], res.body['data']);
  }

  function basicModelList(res: any, ofModel: string, attrFields?: Array<string>, relFields?: Array<string>) {
    expect(res).to.have.status(200);
    expect(res).to.be.json;

    // Has standard info.
    hasJSONAPIDocumentForm(res.body);

    // In a list of objects
    expect(res.body['data']).to.be.an('array');

    // Are correct model
    res.body['data'].forEach((d: any) => {
      expect(d['type']).to.be.equal(ofModel);
      isFullModel(models[ofModel], d, attrFields, relFields);
    });

    expect(res.body['data']).to.be.an('array');

    const length = Math.min(
      res.body['meta']['page']['total'] - res.body['meta']['page']['offset'],
      res.body['meta']['page']['limit'],
    );

    expect(res.body['data']).length.to.have.lengthOf(length);
  }

  function testIncludesOfType(body: any, include: string) {
    const listOfModels = Array.isArray(body['data'])
        ? body['data']
        : [body['data']];

    const items = listOfModels.reduce((sum: any, m: any) => {
      const relationData = m['relationships'][include]['data'];
      if (Array.isArray(relationData)) {
        relationData.forEach((r: any) => {
          sum[r.id] = true;
        });
      } else {
        sum[relationData.id] = true;
      }

      return sum;
    }, {} as any);

    const length = Object.keys(items).length;

    expect(body['included']).to.be.lengthOf(length);

    const lookup = body['included'].reduce((sum: any, m: any) => {
      sum[m.id] = sum[m.id] || 0;
      sum[m.id] += 1;

      return sum;
    }, {});

    Object.keys(lookup).forEach((key) => {
      expect(lookup[key]).to.be.equal(1);
    });
  }

  function testAttrFilters(body: any, attrs: Array<string>, values: Array<any>) {
    body['data'].forEach((r: any) => {
      attrs.forEach((a, i) => {
        expect(r['attributes'][a]).to.be.equal(values[i]);
      });
    });
  }

  function testRelationshipFilter(body: any, relationship: string, relationshipID: number) {
    body['data'].forEach((r: any) => {
      const relationshipData = r['relationships'][relationship].data;
      expect(relationshipData['id']).to.be.equal(relationshipID);
    });
  }

  function listTests(prefix: string, allModels: any, modelType: string) {
    describe('GET (basic)', () => {
      it(`List of ${modelType} objects`, async () => {
        const res = await chai.request(server).get(`${prefix}`);
        basicModelList(res, modelType);
        expect(res.body['data'][0].id).to.be.equal(allModels[0].id);
        expect(res.body['meta']['page']['total'])
            .to.be.equal(allModels.length);
        expect(res.body['included']).to.be.empty;
      });
    });

    describe('GET (paging)', () => {
      it(`the first paged list of ${modelType} objects`, async () => {
        const PER_PAGE = 3;
        const res = await chai.request(server).get(`${prefix}?page[limit]=${PER_PAGE}`);

        basicModelList(res, modelType);
        expect(res.body['included']).to.be.empty;
        expect(res.body['meta']['page']['total'])
            .to.be.equal(allModels.length);
        expect(res.body['meta']['page']['offset']).to.be.equal(0);
        expect(res.body['meta']['page']['limit']).to.be.equal(PER_PAGE);
        expect(res.body['data'][0].id).to.be.equal(allModels[0].id);
      });

      it(`the next page of ${modelType} objects`, async () => {
        const PER_PAGE = 1;
        const res = await chai.request(server).get(
          `${prefix}?page[limit]=${PER_PAGE}&page[offset]=${PER_PAGE}`,
        );

        basicModelList(res, modelType);
        expect(res.body['included']).to.be.empty;
        expect(res.body['meta']['page']['total'])
            .to.be.equal(allModels.length);
        expect(res.body['meta']['page']['offset']).to.be.equal(PER_PAGE);
        expect(res.body['meta']['page']['limit']).to.be.equal(PER_PAGE);
        expect(res.body['data'][0].id).to.be.equal(allModels[PER_PAGE].id);
      });

      it(`an empty page of ${modelType} objects`, async () => {
        const PER_PAGE = 5;
        const OFFSET = allModels.length;
        const res = await chai.request(server).get(
          `${prefix}?page[limit]=${PER_PAGE}&page[offset]=${OFFSET}`,
        );

        basicModelList(res, modelType);
        expect(res.body['meta']['page']['total'])
            .to.be.equal(allModels.length);
        expect(res.body['included']).to.be.empty;
        expect(res.body['data']).to.be.empty;
      });
    });

    if (models[modelType].include) {
      describe('GET (includes)', () => {
        const includeType = models[modelType].include[0];
        it(`included ${includeType} of ${modelType} objects`, async () => {
          const res = await chai.request(server).get(
            `${prefix}?include=${includeType}`,
          );

          basicModelList(res, modelType);
          expect(res.body['meta']['page']['total'])
              .to.be.equal(allModels.length);
          testIncludesOfType(res.body, includeType);
        });
      });
    }

    describe('GET (filter)', () => {
      it(`filtered ${modelType} objects by a single attribute`, async () => {
        const firstObj = models[modelType].spec;
        const firstAttr = Object.keys(omit(firstObj, ['id', 'type']))[0];
        const firstValue = firstObj[firstAttr];
        const res = await chai.request(server).get(
          `${prefix}?filter[${firstAttr}]=${encodeURIComponent(firstValue)}`,
        );

        basicModelList(res, modelType);
        testAttrFilters(res.body, [firstAttr], [firstValue]);
      });

      const lastObj = models[modelType].all[models[modelType].all.length - 1];
      const modelKeys = Object.keys(omit(lastObj, ['id', 'type']));

      if (modelKeys.length > 1) {
        it(`filtered ${modelType} objects by multiple attributes`, async () => {
          const firstAttr = modelKeys[0];
          const firstValue = lastObj[firstAttr];
          const secondAttr = modelKeys[2];
          const secondValue = lastObj[secondAttr];

          const res = await chai.request(server).get(
            `${prefix}?filter[${firstAttr}]=${encodeURIComponent(firstValue)}` +
            `&filter[${secondAttr}]=${encodeURIComponent(secondValue)}`,
          );

          basicModelList(res, modelType);
          testAttrFilters(
            res.body,
            [firstAttr, secondAttr],
            [firstValue, secondValue],
          );
        });
      }

      if (models[modelType].include) {
        it(`filtered ${modelType} objects by a relationship`, async () => {
          const firstObj = models[modelType].spec;
          const relationship = models[modelType].include[0];
          const relationshipID = firstObj[relationship].id;
          const res = await chai.request(server).get(
            `${prefix}?filter[${relationship}]=${relationshipID}`,
          );

          basicModelList(res, modelType);
          testRelationshipFilter(res.body, relationship, relationshipID);
        });
      }
    });

    describe('GET (sort)', () => {
      const allFields = Object.keys(
        omit(models[modelType].spec,
        ['id', 'type']),
      ).filter((f) => (
        (typeof models[modelType].spec[f] === 'string') ||
        (typeof models[modelType].spec[f] === 'number')
      ));
      const firstAttr = allFields[0];
      const secondAttr = allFields[1];

      it(`Sorted ${modelType} objects by a single attribute asc`, async () => {
        const res = await chai.request(server).get(`${prefix}?sort=${firstAttr}`);
        basicModelList(res, modelType);

        // TODO: why is the normaliser necessary?
        const n = getNormaliser(firstAttr);
        expect(n(res.body.data[0].attributes[firstAttr]))
            .to.be.lte(n(res.body.data[1].attributes[firstAttr]));
      });

      it(`Sorted ${modelType} objects by a single attribute desc`, async () => {
        const res = await chai.request(server).get(`${prefix}?sort=-${firstAttr}`);

        basicModelList(res, modelType);

        const n = getNormaliser(firstAttr);
        expect(n(res.body.data[0].attributes[firstAttr]))
             .to.be.gte(n(res.body.data[1].attributes[firstAttr]));
      });

      if (secondAttr) {
        it(`Sorted ${modelType} objects by two attribute asc`, async () => {
          const res = await chai.request(server).get(
            `${prefix}?sort=${firstAttr},${secondAttr}`,
          );

          basicModelList(res, modelType);

          const n = getNormaliser(firstAttr);
          expect(n(res.body.data[0].attributes[firstAttr]))
              .to.be.lte(n(res.body.data[1].attributes[firstAttr]));
        });

        it(`Sorted ${modelType} objects by two attribute desc`, async () => {
          const res = await chai.request(server).get(
            `${prefix}?sort=-${firstAttr},-${secondAttr}`,
          );

          basicModelList(res, modelType);

          const n = getNormaliser(firstAttr);
          expect(n(res.body.data[0].attributes[firstAttr]))
              .to.be.gte(n(res.body.data[1].attributes[firstAttr]));
        });
      }
    });
  }

  function singleTests(prefix: string, modelType: string) {
    describe('GET', () => {
      it(`a ${modelType} object`, async () => {
        const res = await chai.request(server).get(`${prefix}`);
        basicSingleModel(res, modelType);
      });
    });

    if (models[modelType].include) {
      describe('GET (includes)', () => {
        const includeType = models[modelType].include[0];
        it(`included ${includeType} of ${modelType} objects`, async () => {
          const res = await chai.request(server).get(
            `${prefix}?include=${includeType}`,
          );

          basicSingleModel(res, modelType);
          testIncludesOfType(res.body, includeType);
        });
      });
    }
  }

  function basicCreate(res: any, ofModel: string) {
    expect(res).to.be.json;
    expect(res).to.have.status(201);

    hasJSONAPIDocumentForm(res.body);

    expect(res.body['data']).to.be.an('object');

    expect(res.body['data']['type']).to.be.equal(ofModel);
    isFullModel(models[ofModel], res.body['data']);
  }

  return {
    basicSingleModel,
    basicModelList,
    testIncludesOfType,
    testAttrFilters,
    testRelationshipFilter,
    listTests,
    singleTests,
    basicCreate,
  };
}
