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

import {DataTypes, Model} from 'sequelize';

import {sequelize} from '../sequelize';

/**
 * Category model
 */

class LastUpdate extends Model {
  lastUpdate: number;
}

LastUpdate.init({
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    primaryKey: true,
  },

  lastUpdate: {
    type: DataTypes.INTEGER.UNSIGNED,
  },
}, {
  sequelize,
  modelName: 'last_updates',
});

export let lastUpdateLocal = 0;

export function testLocalUpdate(value: number) {
  const updated = lastUpdateLocal !== value;
  lastUpdateLocal = value;
  return updated;
}

export async function getInstance() {
  const instance = await LastUpdate.findOne({where: {id: 1}});
  if (instance) {
    return instance;
  }
  return LastUpdate.create({id: 1, lastUpdate: 1});
}

export async function updateLastUpdate() {
  const instance = await getInstance();
  instance.lastUpdate = instance.lastUpdate + 1;
  testLocalUpdate(instance.lastUpdate);
  await instance.save();
}
