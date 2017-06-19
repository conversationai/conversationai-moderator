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

import { cloneDeep } from 'lodash';
import {
  apiClient,
  expect,
  models,
  serializers,
} from './test_helper';

Object.keys(models).forEach((modelName) => {
  describe(`${modelName} API`, () => {
    /**
     * Delete Tests (/modelName)
     */
    describe(`/${modelName}`, () => {
      const serializedModel = serializers[modelName].serialize(cloneDeep(models[modelName].spec));
      delete serializedModel.id;
      describe('DELETE', () => {
        it(`delete a ${modelName} object`, async () => {
          const res = await apiClient.post(`/${modelName}`).send({ data: serializedModel });

          const res2 = await apiClient.del(`${res.body.data.links.self}`);
          expect(res2).to.have.status(204);

          let res3;
          try {
            res3 = await apiClient.get(`${res.body.data.links.self}`);
          } catch (e) {
            expect(e.status).to.equal(404);
          }
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
        it(`create a ${models[modelName].include[0]} relation on ${modelName}`, async () => {
          const serializedModel = serializers[modelName].serialize(cloneDeep(models[modelName].spec));

          const rels = [
            { id: `${models[modelName].include[0]}-a-rel-1`, type: models[modelName].include[1] },
            { id: `${models[modelName].include[0]}-a-rel-2`, type: models[modelName].include[1] },
            { id: `${models[modelName].include[0]}-a-rel-3`, type: models[modelName].include[1] },
            { id: `${models[modelName].include[0]}-a-rel-4`, type: models[modelName].include[1] },
          ];

          serializedModel.relationships[models[modelName].include[0]].data = rels;
          delete serializedModel.id;
          const res = await apiClient.post(`/${modelName}`).send({ data: serializedModel });

          const res2 = await apiClient.del(
            res.body.data.relationships[models[modelName].include[0]].links.self,
          ).send({
            data: [
              rels[1],
              rels[2],
            ],
          });

          expect(res2).to.have.status(204);

          const res3 = await apiClient.get(res.body.data.links.self);
          expect(res3.body.data.relationships[models[modelName].include[0]].data).to.be.lengthOf(2);
        });
      });
    }
  });
});
