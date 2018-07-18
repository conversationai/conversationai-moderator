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
import { cloneDeep, isArray, isEqual } from 'lodash';
import {
  expect,
  models,
  serializers,
  server,
  sharedTestHelper,
} from './test_helper';

describe(`JSON API update tests`, () => {
  Object.keys(models).forEach((modelName) => {
    const {
      basicSingleModel,
    } = sharedTestHelper();

    describe(`${modelName} API`, () => {
      /**
       * Update Tests (/modelName)
       */
      describe(`/${modelName}/:id`, () => {
        const serializedModel = serializers[modelName].serialize(
          cloneDeep(models[modelName].spec),
        );
        delete serializedModel.id;
        describe('PATCH', () => {
          it(`update a ${modelName} object's attributes`, async () => {
            const res = await chai.request(server).post(`/${modelName}`).send({ data: serializedModel });

            // Figure out what to change.
            const clonedModel = cloneDeep(res.body.data);

            const attrKeys = Object.keys(clonedModel.attributes);
            const changeCount = Math.ceil(attrKeys.length / 2);

            const updatedAttrs = {} as any;

            for (let i = 0; i < changeCount; i++) {
              if (typeof clonedModel.attributes[attrKeys[i]] === 'string' &&
                  typeof parseInt(clonedModel.attributes[attrKeys[i]], 10) === 'number') {
                updatedAttrs[attrKeys[i]] = Math.floor(Math.random() * 100).toString();
              } else if (typeof clonedModel.attributes[attrKeys[i]] === 'string') {
                updatedAttrs[attrKeys[i]] = 'i am a random string';
              } else if (typeof clonedModel.attributes[attrKeys[i]] === 'number') {
                updatedAttrs[attrKeys[i]] = Math.floor(Math.random() * 100);
              }
            }

            clonedModel.attributes = updatedAttrs;

            const res2 = await chai.request(server).patch(res.body.data.links.self).send({ data: clonedModel });

            basicSingleModel(res2, modelName);
            expect(res2.body['included']).to.be.undefined;

            for (const key in res.body.data.attributes) {
              if (res.body.data.attributes.hasOwnProperty(key)) {
                if (typeof updatedAttrs[key] !== 'undefined') {
                  expect(isEqual(res2.body.data.attributes[key], updatedAttrs[key])).to.be.true;
                } else {
                  expect(isEqual(res2.body.data.attributes[key], res.body.data.attributes[key])).to.be.true;
                }
              }
            }

            const res3 = await chai.request(server).get(res2.body.data.links.self);

            basicSingleModel(res3, modelName);
            expect(isEqual(res2.body.data, res3.body.data)).to.be.true;
          });

          if (models[modelName].include) {
            it(`update a ${modelName} object's relationships`, async () => {
              const res = await chai.request(server).post(`/${modelName}`).send({ data: serializedModel });

              // Figure out what to change.
              const clonedModel = cloneDeep(res.body.data);

              const relKeys = Object.keys(clonedModel.relationships);
              const changeCount = Math.ceil(relKeys.length / 2);

              const updatedRels = {} as any;

              for (let i = 0; i < changeCount; i++) {
                const fakeRel = { id: `fake-${relKeys[i]}`, type: relKeys[i] };

                if (isArray(clonedModel.relationships[relKeys[i]])) {
                  updatedRels[relKeys[i]].push(fakeRel);
                } else if (clonedModel.relationships[relKeys[i]] === null) {
                  updatedRels[relKeys[i]] = fakeRel;
                } else {
                  updatedRels[relKeys[i]] = null;
                }
              }

              clonedModel.relationships = updatedRels;

              const res2 = await chai.request(server).patch(res.body.data.links.self).send({ data: clonedModel });
              basicSingleModel(res2, modelName);
              expect(res2.body['included']).to.be.undefined;

              for (const key in res.body.data.attributes) {
                if (res.body.data.attributes.hasOwnProperty(key)) {
                  if (typeof updatedRels[key] !== 'undefined') {
                    expect(isEqual(res2.body.data.attributes[key], updatedRels[key])).to.be.true;
                  } else {
                    expect(isEqual(res2.body.data.attributes[key], res.body.data.attributes[key])).to.be.true;
                  }
                }
              }

              const res3 = await chai.request(server).get(res2.body.data.links.self);
              basicSingleModel(res3, modelName);

              expect(isEqual(res2.body.data, res3.body.data)).to.be.true;
            });
          }
        });
      });

      /**
       * Relationships Tests (/modelName/:id/:relationship)
       */
      if (models[modelName].include) {
        describe(`/${modelName}/:id/relationships/${models[modelName].include[0]}`, () => {
          const serializedModel = serializers[modelName].serialize(cloneDeep(models[modelName].spec));
          delete serializedModel.id;

          if (models[modelName].include[0] !== models[modelName].include[1]) {
            const newValue = {
              id: `${models[modelName].include[0]}-a-rel-1`,
              type: models[modelName].include[1],
            };

            it(`change a ${models[modelName].include[0]} relation on ${modelName}`, async () => {
              const res = await chai.request(server).post(
                `/${modelName}`,
              ).send({ data: serializedModel });

              const res2 = await chai.request(server).patch(
                res.body.data.relationships[models[modelName].include[0]].links.self,
              ).send({ data: newValue });

              expect(res2).to.have.status(204);

              const res3 = await chai.request(server).get(res.body.data.links.self);
              const rels = res3.body.data.relationships;
              expect(isEqual(
                rels[models[modelName].include[0]].data,
                newValue,
              )).to.be.true;
            });

            it(`clear a ${models[modelName].include[0]} relation on ${modelName}`, async () => {
              const res = await chai.request(server).post(`/${modelName}`).send({ data: serializedModel });

              const res2 = await chai.request(server).patch(
                res.body.data.relationships[models[modelName].include[0]].links.self,
              ).send({ data: null });

              expect(res2).to.have.status(204);

              const res3 = await chai.request(server).get(res.body.data.links.self);
              expect(res3.body.data.relationships[models[modelName].include[0]].data).to.be.undefined;
            });
          } else {
            const newValue = { id: `${models[modelName].include[0]}-a-rel-1`, type: models[modelName].include[1] };

            it(`change a ${models[modelName].include[0]} relation on ${modelName}`, async () => {
              const res = await chai.request(server).post(`/${modelName}`).send({ data: serializedModel });

              const newData = res.body.data.relationships[models[modelName].include[0]].data;
              newData.push(newValue);

              const res2 = await chai.request(server).patch(
                res.body.data.relationships[models[modelName].include[0]].links.self,
              ).send({ data: newData });

              expect(res2).to.have.status(204);

              const res3 = await chai.request(server).get(res.body.data.links.self);
              const rels = res3.body.data.relationships;
              expect(isEqual(
                rels[models[modelName].include[0]].data,
                newData,
              )).to.be.true;
            });

            it(`empties a ${models[modelName].include[0]} relation on ${modelName}`, async () => {
              const res = await chai.request(server).post(`/${modelName}`).send({ data: serializedModel });
              const res2 = await chai.request(server).patch(
                res.body.data.relationships[models[modelName].include[0]].links.self,
              ).send({ data: [] });

              expect(res2).to.have.status(204);

              const res3 = await chai.request(server).get(res.body.data.links.self);
              expect(res3.body.data.relationships[models[modelName].include[0]].data).to.be.empty;
            });
          }
        });
      }
    });
  });
});
