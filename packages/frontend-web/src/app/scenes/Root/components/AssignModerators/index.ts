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
import { IUserModel } from '../../../../../models';
import { getUser } from '../../../../auth/store';
import { IAppDispatch, IAppStateRecord } from '../../../../stores';
import {
  addModeratorToArticle,
  addModeratorToCategory,
  getArticleModeratorIds,
  getCategoryModeratorIds,
  getIsReady,
  removeModeratorFromArticle,
  removeModeratorFromCategory,
} from '../../../../stores/moderators';
import { getUsers } from '../../../../stores/users';
import {
  AssignModerators as PureAssignModerators,
  IAssignModeratorsProps,
} from './AssignModerators';

function getIsModeratedUser(state: IAppStateRecord, userId: string): boolean {
  if (getArticleModeratorIds(state)) {
    return getArticleModeratorIds(state).includes(userId);
  }
  if (getArticleModeratorIds(state)) {
    return getCategoryModeratorIds(state).includes(userId);
  }
}

type IAssignModeratorsOwnProps = Pick<
  IAssignModeratorsProps,
  'article' |
  'category' |
  'label' |
  'onClickDone' |
  'onClickClose'
>;

type IAssignModeratorsStateProps = Pick<
  IAssignModeratorsProps,
  'users' |
  'moderatorIds' |
  'isReady'
>;

type IAssignModeratorsDispatchProps = Pick<
  IAssignModeratorsProps,
  'onAddModerator' |
  'onRemoveModerator'
>;

const mapStateToProps = createStructuredSelector({
  users: (state: IAppStateRecord): Array<IUserModel> => {
    const currentUser = getUser(state);
    const allUsers = getUsers(state);

    const assignedUsers = allUsers
        .filter((user) => getIsModeratedUser(state, user.id) && !user.equals(currentUser));

    const assignedUsersSorted = assignedUsers
        .sort((a, b) => a.name.localeCompare(b.name))
        .toArray();

    const unassignedUsers = allUsers
        .filter((user) => !getIsModeratedUser(state, user.id) && !user.equals(currentUser));

    const unassignedUsersSorted = unassignedUsers
        .sort((a, b) => a.name.localeCompare(b.name))
        .toArray();

    return [currentUser, ...assignedUsersSorted, ...unassignedUsersSorted];
  },

  moderatorIds: (state: IAppStateRecord, { article }: any) => (
    article
      ? getArticleModeratorIds(state)
      : getCategoryModeratorIds(state)
  ),

  isReady: getIsReady,
}) as (state: IAppStateRecord, ownProps: IAssignModeratorsOwnProps) => IAssignModeratorsStateProps;

function mapDispatchToProps(dispatch: IAppDispatch, { article, category }: IAssignModeratorsOwnProps): IAssignModeratorsDispatchProps {
  return {
    onAddModerator: (userId: string) => {
      if (article) {
        dispatch(addModeratorToArticle({ userId }));
      }
      if (category) {
        dispatch(addModeratorToCategory({ userId }));
      }
    },

    onRemoveModerator: (userId: string) => {
      if (article) {
        dispatch(removeModeratorFromArticle({ userId }));
      }
      if (category) {
        dispatch(removeModeratorFromCategory({ userId }));
      }
    },
  };
}

export const AssignModerators = connect<IAssignModeratorsStateProps, IAssignModeratorsDispatchProps, IAssignModeratorsOwnProps>(
  mapStateToProps,
  mapDispatchToProps,
)(PureAssignModerators);
