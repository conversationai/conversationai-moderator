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

import { connect } from 'react-redux';
import { createStructuredSelector } from 'reselect';

import { ICategoryModel } from '../../../../../models';
import { IAppStateRecord } from '../../../../stores';
import { getCategoryCounts } from '../../../../stores/categories';
import { DashboardCategories as PureDashboardCategories } from './DashboardCategories';

// TODO (Issue#27): Fix type
export const DashboardCategories: React.ComponentClass<any> = connect<any>(
  createStructuredSelector({
    categoryCounts: (state: IAppStateRecord) => {
      const categoryCounts = getCategoryCounts(state);

      const combinedCount = categoryCounts.reduce((previousValue, currentValue) => {
        return previousValue + currentValue;
      }, 0);

      return categoryCounts.set('all', combinedCount);
    },

    categories: (state: IAppStateRecord, { categories }: any) => {
      const categoryCounts = getCategoryCounts(state);

      return categories.sort((a: ICategoryModel, b: ICategoryModel) => {
        return categoryCounts.get(b.id.toString()) - categoryCounts.get(a.id.toString());
      });
    },
  }),
)(PureDashboardCategories);
