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
import * as sinon from 'sinon';
import { findOrCreateModels } from '../../../domain/models/create';
import {
  Article,
} from '../../../models';

// Needed for `.resolves` below.
require('bluebird');
require('sinon-bluebird');

const assert = chai.assert;

// tslint:disable

describe('Models domain create tests', function() {
  describe('findOrCreateModels', function() {
    let sandbox: sinon.SinonSandbox;
    let fakeModel: any;

    beforeEach(function() {
      sandbox = sinon.sandbox.create();
      fakeModel = {
        findOrCreate: sandbox.stub(), // This needs a `.resolves()` call tacked on to it to be useful...
        getTableName: () => 'fakeTableName'
      };
    });

    afterEach(function() {
      sandbox.restore();
    });

    it('should create a single article', async () => {
      let articleData: any = {
        sourceId: '123',
        title: 'Sportsball Is Real Cool',
        text: 'Intelligentsia seitan butcher, authentic next level chartreuse bushwick.',
        url: 'http://sportsball.com/article.html',
        sourceCreatedAt: '2012-10-29T21:54:07.609Z',
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
        highlightedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        deferredCount: 0,
        flaggedCount: 0,
        batchedCount: 0,
        recommendedCount: 0,
      };

      // Fake a successful article creation

      fakeModel.findOrCreate.resolves([Article.build(articleData), true]);

      const articles = await findOrCreateModels(fakeModel, articleData);

      assert.isTrue(fakeModel.findOrCreate.calledOnce);
      assert.deepEqual(fakeModel.findOrCreate.getCall(0).args[0], {
        where: {
          sourceId: articleData.sourceId
        },
        defaults: articleData
      });

      assert.isArray(articles);
      assert.lengthOf(articles, 1);

      Object
        .keys(articleData)
        .forEach((key) => {
          if (articles[0].get(key) instanceof Date) {
            assert.equal(+new Date(articleData[key]), +articles[0].get(key));
          } else {
            assert.equal(articleData[key], articles[0].get(key));
          }
        });
    });

    it('should retrieve an article that already exists', async () => {
      let articleData: any = {
        sourceId: '456',
        title: "Sportsball Isn't Cool Anymore",
        text: 'Pinterest bushwick kitsch pitchfork single-origin coffee, messenger bag readymade pop-up.',
        url: 'http://sportsball.com/article-not-cool.html',
        sourceCreatedAt: '2012-10-29T21:54:07.609Z',
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
        highlightedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        deferredCount: 0,
        flaggedCount: 0,
        batchedCount: 0,
        recommendedCount: 0,
      };

      // Fake an existing article
      let fakeArticle = Article.build(articleData);
      fakeModel.findOrCreate.resolves([fakeArticle, false]);

      const articles = await findOrCreateModels(fakeModel, articleData);

      assert.isTrue(fakeModel.findOrCreate.calledOnce);
      assert.deepEqual(fakeModel.findOrCreate.getCall(0).args[0], {
        where: {
          sourceId: articleData.sourceId
        },
        defaults: articleData
      });

      let articleResult = articles[0];

      assert.isArray(articles);
      assert.lengthOf(articles, 1);

      Object
          .keys(articleData)
          .forEach((key) => {
            if (articleResult.get(key) instanceof Date) {
              assert.equal(+new Date(articleData[key]), +articleResult.get(key));
            } else {
              assert.equal(articleData[key], articleResult.get(key));
            }
          });
    });

    it('should find or create multiple articles', async () => {
      let article1Data: any = {
        sourceId: '789',
        title: "Sportsball Is Cool Again",
        text: "Biodiesel tote bag truffaut, marfa heirloom scenester art party occupy 90's swag four loko fashion axe bitters.",
        url: 'http://sportsball.com/article-cool-again.html',
        sourceCreatedAt: '2012-10-29T21:54:07.609Z',
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
        highlightedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        deferredCount: 0,
        flaggedCount: 0,
        batchedCount: 0,
        recommendedCount: 0,
      };

      let article2Data = {
        sourceId: '1023',
        title: "Sportsball Is OK",
        text: "Everyday carry ethical you probably haven't heard of them, kinfolk lomo green juice tofu bespoke occupy",
        url: 'http://sportsball.com/article-ok.html',
        sourceCreatedAt: '2012-10-29T21:54:07.609Z',
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
        highlightedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        deferredCount: 0,
        flaggedCount: 0,
        batchedCount: 0,
        recommendedCount: 0,
      };

      let articlesData = [article1Data, article2Data];

      // Fake create/find multiple articles

      let fakeArticle1 = Article.build(article1Data);
      let fakeArticle2 = Article.build(article2Data);

      fakeModel.findOrCreate.onCall(0).resolves([fakeArticle1, true]);
      fakeModel.findOrCreate.onCall(1).resolves([fakeArticle2, false]);

      const articles = await findOrCreateModels(fakeModel, articlesData);

      assert.isTrue(fakeModel.findOrCreate.calledTwice);

      articlesData.forEach((articleData, index) => {
        assert.deepEqual(fakeModel.findOrCreate.getCall(index).args[0], {
          where: {
            sourceId: articleData.sourceId
          },
          defaults: articleData
        });
      });

      assert.isArray(articles);
      assert.lengthOf(articles, 2);

      articles.forEach((item, index) => {
        Object
            .keys(articlesData[index])
            .forEach((key) => {
              if (item.get(key) instanceof Date) {
                assert.equal(+new Date(articlesData[index][key]), +item.get(key));
              } else {
                assert.equal(articlesData[index][key], item.get(key));
              }
            });
      });
    });

    it('should exclude empty results', async () => {
      let article1Data: any = {
        sourceId: '543',
        title: "Kickstarter lo-fi brooklyn affogato",
        text: "Drinking vinegar ennui ethical man bun dreamcatcher fingerstache messenger bag asymmetrical.",
        url: 'http://sportsball.com/kickstarter-lo-fi.html',
        sourceCreatedAt: '2012-10-29T21:54:07.609Z',
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
        highlightedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        deferredCount: 0,
        flaggedCount: 0,
        batchedCount: 0,
        recommendedCount: 0,
      };

      let article2Data: any = {
        title: "Lumbersexual schlitz fashion",
        text: "Tumblr deep v normcore, venmo asymmetrical readymade leggings mumblecore man bun.",
        url: 'http://sportsball.com/lumbersexual-schlitz-fashion.html',
        sourceCreatedAt: '2012-10-29T21:54:07.609Z',
        unprocessedCount: 0,
        unmoderatedCount: 0,
        moderatedCount: 0,
        highlightedCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        deferredCount: 0,
        flaggedCount: 0,
        batchedCount: 0,
        recommendedCount: 0,
      };

      let articlesData = [article1Data, article2Data];

      // Create a fake article, reject the second call, faking a thrown error

      let fakeArticle1 = Article.build(article1Data);

      fakeModel.findOrCreate.onCall(0).resolves([fakeArticle1, true]);
      fakeModel.findOrCreate.onCall(1).rejects();

      const articles = await findOrCreateModels(fakeModel, articlesData);

      assert.isTrue(fakeModel.findOrCreate.calledTwice);

      assert.isArray(articles);
      assert.lengthOf(articles, 1);

      Object
          .keys(article1Data)
          .forEach((key) => {
            if (articles[0].get(key) instanceof Date) {
              assert.equal(+new Date(article1Data[key]), +articles[0].get(key));
            } else {
              assert.equal(article1Data[key], articles[0].get(key));
            }
          });
    });
  });
});

// tslint:enable
