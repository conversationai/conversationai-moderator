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
import { cloneDeep, isEqual } from 'lodash';
import {
  expect,
  models,
  serializers,
  server,
  sharedTestHelper,
} from './test_helper';

Object.keys(models).forEach((modelName) => {
  const {
    basicCreate,
    basicSingleModel,
  } = sharedTestHelper();

  describe(`${modelName} API`, () => {
    /**
     * Create Tests (/modelName)
     */
    describe(`/${modelName}`, () => {
      const serializedModel = serializers[modelName].serialize(cloneDeep(models[modelName].spec));
      delete serializedModel.id;

      describe('POST', () => {
        it(`create a ${modelName} object`, async () => {
          const res = await chai.request(server).post(`/${modelName}`).send({ data: serializedModel });

          basicCreate(res, modelName);
          expect(res.body['included']).to.be.undefined;

          const res2 = await chai.request(server).get(res.body.data.links.self);
          basicSingleModel(res2, modelName);

          expect(isEqual(res.body.data, res2.body.data)).to.be.true;
        });
      });
    });

    /**
     * Relationships Tests (/modelName/:id/:relationship)
     */
    if (models[modelName].include && (
      // Only test many posts
      models[modelName].include[0] === models[modelName].include[1]
    )) {
      describe(`/${modelName}/:id/relationships/${models[modelName].include[0]}`, () => {
        const twoRelationships = [
          { id: `${models[modelName].include[0]}-a-rel-1`, type: models[modelName].include[1] },
          { id: `${models[modelName].include[0]}-a-rel-2`, type: models[modelName].include[1] },
        ];

        it(`create a ${models[modelName].include[0]} relation on ${modelName}`, async () => {
          const originalCount = models[modelName].spec[models[modelName].include[0]].length;
          const serializedModel = serializers[modelName].serialize(cloneDeep(models[modelName].spec));
          delete serializedModel.id;

          const res = await chai.request(server).post(`/${modelName}`).send({ data: serializedModel });

          const res2 = await chai.request(server).post(
            res.body.data.relationships[models[modelName].include[0]].links.self,
          ).send({ data: twoRelationships });

          expect(res2).to.have.status(204);

          const res3 = await chai.request(server).get(res.body.data.links.self);
          const rels = res3.body.data.relationships;
          expect(rels[models[modelName].include[0]].data).to.be.lengthOf(
            originalCount + twoRelationships.length,
          );
        });
      });
    }
  });
});
