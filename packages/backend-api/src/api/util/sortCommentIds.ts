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
import {Op} from 'sequelize';

import {Comment} from '../../models';

export async function sortCommentIds(
  ids: Array<number>,
  sort: Array<string>,
): Promise<Array<number>> {

  const order: Array<Array<string>> = [];

  for (let sortItem of sort) {
    let orderItem = 'ASC';
    if (sortItem.startsWith('-')) {
      sortItem = sortItem.substring(1);
      orderItem = 'DESC';
    }
    order.push([sortItem, orderItem]);
  }

  const items: Array<{id: number}> = await Comment.findAll({
    where: { id: {[Op.in]: ids } },
    order,
    attributes: ['id'],
  });

  return items.map((item: any) => item.id);
}
