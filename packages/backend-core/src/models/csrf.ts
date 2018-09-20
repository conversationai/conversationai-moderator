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

export interface ICSRFAttributes {
  id?: number;
  clientCSRF: string;
  serverCSRF: string;
  referrer: string | null;
}

export interface ICSRFInstance extends Sequelize.Instance<ICSRFAttributes> {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * CSRF model
 */
export const CSRF = sequelize.define<ICSRFInstance, ICSRFAttributes>('csrfs', {
  clientCSRF: {
    type: Sequelize.CHAR(255),
    allowNull: false,
  },

  serverCSRF: {
    type: Sequelize.CHAR(255),
    allowNull: false,
  },

  referrer: {
    type: Sequelize.CHAR(255),
    allowNull: true,
  },
});
