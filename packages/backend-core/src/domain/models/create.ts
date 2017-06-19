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

import { compact } from 'lodash';
import { Model } from 'sequelize';
import { logger } from '../../logger';

import * as Bluebird from 'bluebird';

/**
 * Check the database for an existing rows, checking by `sourceId`
 * return it, otherwise create and return an model instance. Can take a single
 * data object or an array of them. This doesn't care about insertion errors
 * and will simple log them and prune any fails out of the resulting array.
 *
 * Usage:
 *
 *
 *       // Find or create a single record
 *
 *       const articles = await findOrCreateModel(Article, {sourceId: 123, title: 'Some Article'})
 *       if (articles.length) {
 *         // ...
 *       }
 *
 *       // Find or create multiple records
 *
 *       let articles = [
 *         {sourceId: 123, title: 'Some Article'},
 *         {sourceId: 456, title: 'Another Article'}
 *       ];
 *
 *       const articleModels = await findOrCreateModel(Article, articles)
 *       // ...
 *
 *
 * @param  {object} model    Sequelize model class object to find/create with
 * @param  {mixed} data      Single data object or an array of them as formatted for insertion in the model
 * @return {object}          Promise object that resolves to an array of model instances
 */
export async function findOrCreateModels<T extends Model<any, any>>(model: T, data: any | Array<any>): Promise<Array<T>> {
  if (!Array.isArray(data)) {
    data = [data];
  }

  const modelName = model.getTableName();

  const instances = await Bluebird.mapSeries(data, async (itemData: any) => {
    try {
      const [instance, created] = await model.findOrCreate({
        where: {
          sourceId: itemData.sourceId,
        },
        defaults: itemData,
      });

      if (created) {
        logger.info('%s row created (source id: %s)', modelName, instance.get('sourceId'));
      } else {
        logger.info('%s row already exists (source id: %s)', modelName, instance.get('sourceId'));
      }

      return instance;
    } catch (err) {
      logger.error('Error finding/creating %s row (source id: %s): %s', modelName, itemData.sourceId, err);
    }
  });

  // Omit falsy values, bad ones come through as `undefined`
  return compact(instances);
}
