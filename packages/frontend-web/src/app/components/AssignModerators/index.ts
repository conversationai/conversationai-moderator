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

import { IUserModel } from '../../../models';
import { getMyUserId } from '../../auth';
import { IAppStateRecord } from '../../stores';
import { getUsers } from '../../stores/users';
import {
  AssignModerators as PureAssignModerators,
  IAssignModeratorsProps,
} from './AssignModerators';

type IAssignModeratorsOwnProps = Pick<
  IAssignModeratorsProps,
  'label' |
  'moderatorIds' |
  'superModeratorIds' |
  'onAddModerator' |
  'onRemoveModerator' |
  'onClickDone' |
  'onClickClose'
>;

type IAssignModeratorsStateProps = Pick<
  IAssignModeratorsProps,
  'users' |
  'isReady'
>;

function getSortedUsers (state: IAppStateRecord, props: IAssignModeratorsOwnProps): Array<IUserModel> {
  const userId = getMyUserId();
  const allUsers = getUsers(state);
  const currentUser = [];
  const assignedUsers = [];
  const unassignedUsers = [];

  for (const u of allUsers.valueSeq().toArray()) {
    if (u.id === userId) {
      currentUser.push(u);
    }
    else if (props.moderatorIds.has(u.id)) {
      assignedUsers.push(u);
    }
    else if (props.superModeratorIds.has(u.id)) {
      assignedUsers.push(u);
    }
    else {
      unassignedUsers.push(u);
    }
  }

  const assignedUsersSorted = assignedUsers.sort((a, b) => a.name.localeCompare(b.name));
  const unassignedUsersSorted = unassignedUsers.sort((a, b) => a.name.localeCompare(b.name));

  return [...currentUser, ...assignedUsersSorted, ...unassignedUsersSorted];
}

const mapStateToProps = createStructuredSelector({
  users: getSortedUsers,
  isReady: () => true,
}) as (state: IAppStateRecord, ownProps: IAssignModeratorsOwnProps) => IAssignModeratorsStateProps;

export const AssignModerators: React.ComponentClass<IAssignModeratorsOwnProps> = connect(
  mapStateToProps,
)(PureAssignModerators);
