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

/**
 * This model is used to store the generic configuration for OSMod, e.g.,
 * - Global configuration
 * - The secret used for token generation
 * - API keys for remote services
 * Note that if there can be multiple copies of the configuration items
 * (e.g., access keys for service being moderated.) then it is probably better
 * served via a custom service user type (e.g, youtube service users.)
 */

import * as Sequelize from 'sequelize';
import { sequelize } from '../sequelize';

export const CONFIGURATION_TOKEN = 'token';

interface IConfigurationAttributes {
  data: any;
}

interface IConfigurationInstance extends Sequelize.Instance<IConfigurationAttributes> {
  id: number;
  updatedAt: string;
}

const Configuration = sequelize.define<IConfigurationInstance, IConfigurationAttributes>('configuration_items', {
  id: {
    type: Sequelize.STRING,
    primaryKey: true,
  },

  data: {
    type: Sequelize.JSON,
    allowNull: false,
  },
});

export async function getConfigItem(itemId: string): Promise<object | null> {
  const item = await Configuration.findOne({where: {id: itemId}});
  if (!item) {
    return null;
  }

  return JSON.parse(item.get('data'));
}

export async function setConfigItem(itemId: string, data: object): Promise<void> {
  const [item, created] = await Configuration.findOrCreate({
      where: {id: itemId},
      defaults: {data},
  });

  if (!created) {
    await item.set('data', data).save();
  }
}
