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

import { List } from 'immutable';
import { connect } from 'react-redux';
import { withRouter } from 'react-router';
import { createStructuredSelector } from 'reselect';

import {
  IPreselectModel,
  IRuleModel,
  ITaggingSensitivityModel,
  ITagModel,
} from '../../../models';
import { listSystemUsers } from '../../platform/dataService';
import { IAppDispatch, IAppState, IAppStateRecord } from '../../stores';
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
  updatePreselects,
  updateRules,
  updateTaggingSensitivities,
  updateTags,
} from './store';

export type ISettingsOwnProps = Pick<
  ISettingsProps,
  'submitForm'
>;

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
  'updatePreselects' |
  'updateRules' |
  'updateTaggingSensitivities' |
  'updateTags' |
  'addUser' |
  'modifyUser'
>;

const mapStateToProps = createStructuredSelector({
  users: (state: IAppStateRecord) => getUsers(state),
  serviceUsers: (state: IAppStateRecord) => getSystemUsers(USER_GROUP_SERVICE, state),
  moderatorUsers: (state: IAppStateRecord) => getSystemUsers(USER_GROUP_MODERATOR, state),
  youtubeUsers: (state: IAppStateRecord) => getSystemUsers(USER_GROUP_YOUTUBE, state),
  tags: getTags,
  categories: getCategories,
  rules: getRules,
  preselects: getPreselects,
  taggingSensitivities: getTaggingSensitivities,
}) as (state: IAppState, props: ISettingsOwnProps) => ISettingsStateProps;

export async function loadSystemUsers(dispatch: IAppDispatch, type: string): Promise<void> {
  const result = await listSystemUsers(type);

  await dispatch(systemUsersLoaded({type, users: result}));
}

function mapDispatchToProps(dispatch: IAppDispatch): ISettingsDispatchProps {
  return {
    reloadServiceUsers: () => loadSystemUsers(dispatch, USER_GROUP_SERVICE),
    reloadModeratorUsers: () => loadSystemUsers(dispatch, USER_GROUP_MODERATOR),
    reloadYoutubeUsers: () => loadSystemUsers(dispatch, USER_GROUP_YOUTUBE),
    updatePreselects: (oldPreselects, newPreselects) => dispatch(updatePreselects(oldPreselects, newPreselects)),
    updateRules: (oldRules, newRules) => dispatch(updateRules(oldRules, newRules)),
    updateTaggingSensitivities: (oldTaggingSensitivities, newTaggingSensitivities) => dispatch(updateTaggingSensitivities(oldTaggingSensitivities, newTaggingSensitivities)),
    updateTags: (oldTags, newTags) => dispatch(updateTags(oldTags, newTags)),
    addUser: addUser,
    modifyUser: modifyUser,
  };
}

function mergeProps(
  stateProps: ISettingsStateProps,
  dispatchProps: ISettingsDispatchProps,
  ownProps: ISettingsOwnProps,
): ISettingsStateProps & ISettingsDispatchProps & ISettingsOwnProps {
  return {
    ...ownProps,
    ...stateProps,
    ...dispatchProps,
    submitForm: (
      newPreselects: List<IPreselectModel>,
      newRules: List<IRuleModel>,
      newTaggingSensitivities: List<ITaggingSensitivityModel>,
      newTags: List<ITagModel>,
    ) => {
      try {
        Promise.all([
          dispatchProps.updatePreselects(stateProps.preselects, newPreselects),
          dispatchProps.updateRules(stateProps.rules, newRules),
          dispatchProps.updateTaggingSensitivities(stateProps.taggingSensitivities, newTaggingSensitivities),
          dispatchProps.updateTags(stateProps.tags, newTags),
        ]);
      } catch (exception) {
        return exception as Error;
      }
    },
  };
}

// Manually wrapping without `compose` so types stay correct.

// Add Redux data.
const ConnectedSettings = connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(PureSettings);

// Add `router` prop.
export const Settings: React.ComponentType = withRouter(ConnectedSettings);
