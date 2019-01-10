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

import { Map } from 'immutable';
import React from 'react';
import { ICategoryModel } from '../../../../../models';
import { css } from '../../../../utilx';
import { DashboardNavCategory } from './components/DashboardNavCategory';

const CATEGORY_STYLES = {
  list: {
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },

  link: {
    textDecoration: 'none',
  },
};

export interface IDashboardCategoriesProps {
  categories: Array<ICategoryModel>;
  categoryCounts: Map<string, number>;
}

export class DashboardCategories extends React.Component<IDashboardCategoriesProps> {
  render() {
    const {
      categories,
      categoryCounts,
    } = this.props;

    return (
      <ul {...css(CATEGORY_STYLES.list)}>
        {categories.map((category) => (
          <li key={category.id}>
            <DashboardNavCategory
              label={category.label}
              count={categoryCounts.get(category.id.toString())}
              slug={category.id.toString()}
            />
          </li>
        ))}
      </ul>
    );
  }
}
