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
import { withRouter } from 'react-router';
import { compose } from 'redux';

import { oldDashboardLink } from '../../../../../routes';
import { DashboardNavCategory as PureDashboardNavCategory, IDashboardNavCategoryProps } from './DashboardNavCategory';

export type IDashboardNavCategoryOwnProps = Pick<IDashboardNavCategoryProps, 'label' | 'count' | 'slug'>;
type IDashboardNavCategoryStateProps = Pick<IDashboardNavCategoryProps, 'isActive' | 'hasNewItems'>;

function mapStateToProps(_state: any, { slug, router }: any): IDashboardNavCategoryStateProps {
  const mylink = oldDashboardLink(slug);
  return {
    isActive: router.isActive(mylink),
    hasNewItems: false,
  };
}

export const DashboardNavCategory: React.ComponentClass<IDashboardNavCategoryOwnProps> = compose(
  withRouter,
  connect<IDashboardNavCategoryStateProps, {}, IDashboardNavCategoryOwnProps>(mapStateToProps),
)(PureDashboardNavCategory) as React.ComponentClass<IDashboardNavCategoryOwnProps>;
