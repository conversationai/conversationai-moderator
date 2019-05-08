/*
Copyright 2019 Google Inc.

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

import * as copyToClipboard from 'copy-to-clipboard';
import React from 'react';

import {
  IconButton,
  Tooltip,
} from '@material-ui/core';
import {
  Edit,
  FileCopy,
} from '@material-ui/icons';

import { IUserModel, ModelId } from '../../../../models';
import { USER_GROUP_ADMIN } from '../../../stores/users';
import { css } from '../../../utilx';
import { SETTINGS_STYLES } from '../settingsStyles';

export interface IUserProps {
  user: IUserModel;
  handleEditUser(userId: ModelId): void;
}

export function UserRow({ user, handleEditUser }: IUserProps) {
  function handleEditUserWrapper() {
    handleEditUser(user.id);
  }

  return (
    <tr {...css(SETTINGS_STYLES.userTableCell)}>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        {user.name}
      </td>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        {user.email}
      </td>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        {user.group === USER_GROUP_ADMIN ? 'Administrator' : 'Moderator'}
      </td>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        {user.isActive ? 'Active' : ''}
      </td>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        <Tooltip title="Edit this user">
          <IconButton onClick={handleEditUserWrapper}>
            <Edit color="primary"/>
          </IconButton>
        </Tooltip>
      </td>
    </tr>
  );
}

export function ServiceUserRow({ user, handleEditUser }: IUserProps) {
  function copyButtonCLicked() {
    copyToClipboard(user.extra.jwt);
  }

  function handleEditUserWrapper() {
    handleEditUser(user.id);
  }

  return (
    <tr {...css(SETTINGS_STYLES.userTableCell)}>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        {user.id}
      </td>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        {user.name}
      </td>
      <td {...css(SETTINGS_STYLES.userTableCell, {fontSize: '10px'})}>
        {user.extra.jwt}
      </td>
      <td>
        <Tooltip title="Copy auth token to clipboard">
          <IconButton aria-label="Copy to clipboard" onClick={copyButtonCLicked}>
            <FileCopy fontSize="small" />
          </IconButton>
        </Tooltip>
      </td>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        {user.isActive ? 'Active' : ''}
      </td>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        <Tooltip title="Edit this user">
          <IconButton onClick={handleEditUserWrapper}>
            <Edit color="primary"/>
          </IconButton>
        </Tooltip>
      </td>
    </tr>
  );
}

export function ModeratorUserRow({ user }: {user: IUserModel}) {
  return (
    <tr {...css(SETTINGS_STYLES.userTableCell)}>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        {user.name}
      </td>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        {user.extra.endpointType}
      </td>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        {user.extra.endpoint}
      </td>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        {user.isActive ? 'Active' : ''}
      </td>
    </tr>
  );
}

export function YoutubeUserRow({ user: u }: {user: IUserModel}) {
  return (
    <tr key={u.id} {...css(SETTINGS_STYLES.userTableCell)}>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        {u.name}
      </td>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        {u.email}
      </td>
      <td {...css(SETTINGS_STYLES.userTableCell)}>
        {u.isActive ? 'Active' : 'Inactive'}
      </td>
    </tr>
  );
}
