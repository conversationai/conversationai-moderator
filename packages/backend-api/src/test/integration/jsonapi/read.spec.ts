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
import {
  expect,
  models,
  server,
  sharedTestHelper,
} from './test_helper';

Object.keys(models).forEach((modelName) => {
  const {
    listTests,
    singleTests,
  } = sharedTestHelper();

  describe(`${modelName} API`, () => {
    /**
     * List Tests (/modelName)
     */
    describe(`/${modelName}`, () => {
      listTests(`/${modelName}`, models[modelName].all, modelName);

      describe('GET (bad record)', () => {
        it(`returns a 404`, async () => {
          let res;
          res = await chai.request(server).get(`/${modelName}/fake`);
          expect(res.status).to.equal(404);
        });
      });
    });

    /**
     * Get Tests (/modelName/:id)
     */
    describe(`/${modelName}/:id`, () => {
      singleTests(`/${modelName}/${models[modelName].spec.id}`, modelName);
    });

    /**
     * Relationship Tests (/modelName/:id/relationships/:relationship)
     */
    if (models[modelName].include) {
      const relationshipPrefix = `/${modelName}/${models[modelName].spec.id}` +
          `/relationships/${models[modelName].include[0]}`;

      describe(`/${modelName}/:id/relationships/${models[modelName].include[0]}`, () => {

        describe('GET (bad record)', () => {
          it(`returns a 404`, async () => {
            let res;

            res = await chai.request(server).get(`/${modelName}/fake/relationships/${models[modelName].include[0]}`);
            expect(res.status).to.equal(404);
          });
        });

        describe('GET (bad relationship)', () => {
          it(`returns a 404`, async () => {
            let res;

            res = await chai.request(server).get(`${relationshipPrefix}/fake`);
            expect(res.status).to.equal(404);
          });
        });

        const relationshipItems = models[modelName].spec[models[modelName].include[0]];

        if (Array.isArray(relationshipItems)) {
          listTests(relationshipPrefix, relationshipItems, models[modelName].include[0]);
        } else {
          singleTests(relationshipPrefix, models[modelName].include[1]);
        }
      });
    }
  });

  if (models[modelName].include) {
      const relatedPrefix = `/${modelName}/${models[modelName].spec.id}` +
          `/${models[modelName].include[0]}`;

      describe(`/${modelName}/:id/${models[modelName].include[0]}`, () => {

        describe('GET (bad record)', () => {
          it(`returns a 404`, async () => {
            let res;

            res = await chai.request(server).get(`/${modelName}/fake/${models[modelName].include[0]}`);
            expect(res.status).to.equal(404);
          });
        });

        describe('GET (bad related)', () => {
          it(`returns a 404`, async () => {
            let res;

            res = await chai.request(server).get(`${relatedPrefix}/fake`);
            expect(res.status).to.equal(404);
        });
        });

        const relationshipItems = models[modelName].spec[models[modelName].include[0]];

        if (Array.isArray(relationshipItems)) {
          listTests(relatedPrefix, relationshipItems, models[modelName].include[0]);
        } else {
          singleTests(relatedPrefix, models[modelName].include[1]);
        }
      });
    }
});
