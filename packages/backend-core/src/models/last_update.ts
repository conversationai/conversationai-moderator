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

import * as Sequelize from 'sequelize';
import { sequelize } from '../sequelize';

export interface ILastUpdateAttributes {
  id: number;
  lastUpdate: number;
}

export interface ILastUpdateInstance
  extends Sequelize.Instance<ILastUpdateAttributes> {
  id: number;
  updatedAt: string;
}

/**
 * Category model
 */
const LastUpdate = sequelize.define<ILastUpdateInstance, ILastUpdateAttributes>('last_update', {
  id: {
    type: Sequelize.INTEGER.UNSIGNED,
    primaryKey: true,
  },
  counter: {
    type: Sequelize.INTEGER.UNSIGNED,
  },
});

let lastUpdateLocal = 0;
let interested: Array<() => void> = [];
let intervalHandle: NodeJS.Timer|null = null;

async function getInstance() {
  const instance = await LastUpdate.findOne({where: {id: 1}});
  if (instance) {
    return instance;
  }
  return await LastUpdate.create({id: 1, lastUpdate: 1});
}

function notifyInterested() {
  for (const i of interested) {
    i();
  }
}

export async function updateHappened() {
  const instance = await getInstance();
  lastUpdateLocal = instance.get('lastUpdate') + 1;
  instance.set('lastUpdate', lastUpdateLocal);
  notifyInterested();
}

export function registerInterest(onChange: () => void, testing = false) {
  if (!testing && !intervalHandle) {
    // Poll every minute
    intervalHandle = setInterval(maybeNotifyInterested, 60000);
  }

  interested.push(onChange);
}

// Exporting for test purposes, but should really be unexported
export async function maybeNotifyInterested() {
  const instance = await getInstance();
  const lastUpdate = instance.get('lastUpdate');
  if (lastUpdate !== lastUpdateLocal) {
    lastUpdateLocal = lastUpdate;
    notifyInterested();
  }
}

export async function clearInterested() {
  interested = [];
  if (intervalHandle) {
    clearInterval(intervalHandle);
  }
}
