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
import { createStructuredSelector } from 'reselect';

import { IAppDispatch, IAppState } from '../../appstate';
import { listSystemUsers } from '../../platform/dataService';
import { getCategories } from '../../stores/categories';
import { getPreselects } from '../../stores/preselects';
import { getRules } from '../../stores/rules';
import { getTaggingSensitivities } from '../../stores/taggingSensitivities';
import { getTags } from '../../stores/tags';
import {
  getSystemUsers,
  getUsers,
  systemUsersLoaded,
  USER_GROUP_MODERATOR,
  USER_GROUP_SERVICE,
  USER_GROUP_YOUTUBE,
} from '../../stores/users';
import { ISettingsProps, Settings as PureSettings } from './Settings';
import {
  addUser,
  modifyUser,
} from './store';

export type ISettingsStateProps = Pick<
  ISettingsProps,
  'users' |
  'serviceUsers' |
  'moderatorUsers' |
  'youtubeUsers' |
  'tags' |
  'categories' |
  'rules' |
  'preselects' |
  'taggingSensitivities'
>;

export type ISettingsDispatchProps = Pick<
  ISettingsProps,
  'reloadServiceUsers' |
  'reloadModeratorUsers' |
  'reloadYoutubeUsers' |
  'addUser' |
  'modifyUser'
>;

const mapStateToProps = createStructuredSelector({
  users: getUsers,
  serviceUsers: (state) => getSystemUsers(USER_GROUP_SERVICE, state),
  moderatorUsers: (state) => getSystemUsers(USER_GROUP_MODERATOR, state),
  youtubeUsers: (state) => getSystemUsers(USER_GROUP_YOUTUBE, state),
  tags: getTags,
  categories: getCategories,
  rules: getRules,
  preselects: getPreselects,
  taggingSensitivities: getTaggingSensitivities,
}) as (state: IAppState, props: ISettingsProps) => ISettingsStateProps;

export async function loadSystemUsers(dispatch: IAppDispatch, type: string): Promise<void> {
  const result = await listSystemUsers(type);

  await dispatch(systemUsersLoaded({type, users: result}));
}

function mapDispatchToProps(dispatch: IAppDispatch): ISettingsDispatchProps {
  return {
    reloadServiceUsers: () => loadSystemUsers(dispatch, USER_GROUP_SERVICE),
    reloadModeratorUsers: () => loadSystemUsers(dispatch, USER_GROUP_MODERATOR),
    reloadYoutubeUsers: () => loadSystemUsers(dispatch, USER_GROUP_YOUTUBE),
    addUser: addUser,
    modifyUser: modifyUser,
  };
}

// Manually wrapping without `compose` so types stay correct.

// Add Redux data.
const ConnectedSettings = connect(
  mapStateToProps,
  mapDispatchToProps,
)(PureSettings);

// Add `router` prop.
export const Settings: React.ComponentType = withRouter(ConnectedSettings);
