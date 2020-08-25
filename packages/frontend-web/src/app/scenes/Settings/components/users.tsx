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

import FocusTrap from 'focus-trap-react';
import { List, Map } from 'immutable';
import React from 'react';

import {
  Fab,
  Tooltip,
} from '@material-ui/core';
import {
  Add,
  Input,
  SaveAlt,
} from '@material-ui/icons';

import { IUserModel, ModelId } from '../../../../models';
import { Scrim } from '../../../components/Scrim';
import { SCRIM_STYLE } from '../../../styles';
import { css } from '../../../utilx';
import { SETTINGS_STYLES } from '../settingsStyles';
import { AddUsers } from './AddUsers';
import { EditUsers } from './EditUsers';
import { EditYouTubeUser } from './EditYouTubeUser';
import { ModeratorUserRow, ServiceUserRow, UserRow, YoutubeUserRow } from './rows';

export function UserSettings(props: {
  users: Map<ModelId, IUserModel>,
  handleEdit(userId: ModelId): void,
  handleAdd(event: React.FormEvent<any>): void,
}) {
  const { users } = props;
  const sortedUsers = users.valueSeq().sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div key="editUsersSection">
      <div key="heading" {...css(SETTINGS_STYLES.heading)}>
        <h2 {...css(SETTINGS_STYLES.headingText)}>Users</h2>
      </div>
      <div key="body" {...css(SETTINGS_STYLES.section)}>
        <div {...css(SETTINGS_STYLES.row)}>
          <table>
            <thead>
            <tr>
              <th key="1" {...css(SETTINGS_STYLES.userTableCell)}>
                Name
              </th>
              <th key="2" {...css(SETTINGS_STYLES.userTableCell)}>
                Email
              </th>
              <th key="3" {...css(SETTINGS_STYLES.userTableCell)}>
                Role
              </th>
              <th key="4" {...css(SETTINGS_STYLES.userTableCell)}>
                Is Active
              </th>
              <th key="5" {...css(SETTINGS_STYLES.userTableCell)}/>
            </tr>
            </thead>
            <tbody>
            {sortedUsers.map((u) => (
              <UserRow key={u.id} user={u} handleEditUser={props.handleEdit}/>
            ))}
            </tbody>
          </table>
        </div>
        <Tooltip title="Add a user">
          <Fab color="primary" onClick={props.handleAdd}>
            <Add/>
          </Fab>
        </Tooltip>
      </div>
    </div>
  );
}

export function ServiceUserSettings(props: {
  users?: List<IUserModel>,
  handleEdit(userId: ModelId): void,
  handleAdd(event: React.FormEvent<any>): void,
}) {
  const {
    users,
  } = props;

  if (!users || users.count() === 0) {
    return (<p>None configured</p>);
  }
  return (
    <div key="serviceUsers" {...css(SETTINGS_STYLES.section)}>
      <h3>Service accounts</h3>
      <p>These accounts are used to access the OSMod API.</p>
      <div key="serviceUsersSection">
        <table>
          <thead>
          <tr>
            <th key="1" {...css(SETTINGS_STYLES.userTableCell)}>
              ID
            </th>
            <th key="2" {...css(SETTINGS_STYLES.userTableCell)}>
              Name
            </th>
            <th key="3" {...css(SETTINGS_STYLES.userTableCell)}>
              JWT Authentication token
            </th>
            <th/>
            <th key="6" {...css(SETTINGS_STYLES.userTableCell)}/>
          </tr>
          </thead>
          <tbody>
          {users.map((u) => (
            <ServiceUserRow key={u.id} user={u} handleEditUser={props.handleEdit}/>
          ))}
          </tbody>
        </table>
      </div>
      <Tooltip title="Add a service user">
        <Fab color="primary" onClick={props.handleAdd}>
          <Add/>
        </Fab>
      </Tooltip>
    </div>
  );
}

export function ModeratorSettings(props: {
  users?: List<IUserModel>,
}) {
  const {
    users,
  } = props;

  if (!users || users.count() === 0) {
    return (<p>None configured</p>);
  }
  return (
    <div key="moderatorUsers" {...css(SETTINGS_STYLES.section)}>
      <h3>Moderator accounts</h3>
      <p>These accounts are responsible for sending comments to the Perspective API scorer.</p>
      <div key="moderatorUsersSection">
        <table>
          <thead>
          <tr>
            <th key="1" {...css(SETTINGS_STYLES.userTableCell)}>
              Name
            </th>
            <th key="3" {...css(SETTINGS_STYLES.userTableCell)}>
              Type
            </th>
            <th key="4" {...css(SETTINGS_STYLES.userTableCell)}>
              Endpoint
            </th>
            <th key="5" {...css(SETTINGS_STYLES.userTableCell)}>
              Is Active
            </th>
            <th key="6" {...css(SETTINGS_STYLES.userTableCell)}/>
          </tr>
          </thead>
          <tbody>
          {users.map((u) => (
            <ModeratorUserRow key={u.id} user={u}/>
          ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function YouTubeUsersSettings(props: {
  users?: List<IUserModel>,
  handleEdit(userId: ModelId): void,
  connect(): void,
  kick(): void,
}) {
  const {
    users,
  } = props;

  if (!users || users.count() === 0) {
    return (<p>None configured</p>);
  }

  return (
    <div key="pluginsContent" {...css(SETTINGS_STYLES.section)}>
      <h3>YouTube accounts</h3>
      <div key="youtubeUsersSection">
        <table>
          <thead>
          <tr>
            <th key="1" {...css(SETTINGS_STYLES.userTableCell)}>
              Name
            </th>
            <th key="2" {...css(SETTINGS_STYLES.userTableCell)}>
              Email
            </th>
            <th key="3" {...css(SETTINGS_STYLES.userTableCell)}>
              Is Active
            </th>
            <th key="4" {...css(SETTINGS_STYLES.userTableCell)}>
              Last Error
            </th>
          </tr>
          </thead>
          <tbody>
          {users.map((u) => (
            <YoutubeUserRow key={u.id} user={u} handleEditUser={props.handleEdit}/>
          ))}
          </tbody>
        </table>
      </div>
      <div key="youtubeButtons" {...css(SETTINGS_STYLES.buttonGroup)}>
        <div style={{paddingRight: '30px'}}>
          <Tooltip title="Connect an account">
            <Fab color="primary" onClick={props.connect}>
              <Input/>
            </Fab>
          </Tooltip>
        </div>
        <div style={{paddingRight: '30px'}}>
          <Tooltip title="Check for new channels">
            <Fab color="primary" onClick={props.kick}>
              <SaveAlt/>
            </Fab>
          </Tooltip>
        </div>
      </div>
      <p>To connect a YouTube account, click the button above, and select a Google user and YouTube account.</p>
      <p>We'll then start syncing comments with the channels and videos in that account.</p>
      <p>If you are seeing errors above, then try reconnecting to your account.</p>
    </div>
  );
}

export function AddUserScrim(props: {
  type?: string,
  visible: boolean,
  close(): void,
  save(user: IUserModel): Promise<void>,
}) {
  return (
    <Scrim
      key="addUserScrim"
      scrimStyles={SCRIM_STYLE.scrim}
      isVisible={props.visible}
      onBackgroundClick={props.close}
    >
      <FocusTrap
        focusTrapOptions={{
          clickOutsideDeactivates: true,
        }}
      >
        <div
          key="addUserContainer"
          tabIndex={0}
          {...css(SCRIM_STYLE.popup, {position: 'relative', width: 450})}
        >
          <AddUsers
            userType={props.type}
            onClickDone={props.save}
            onClickClose={props.close}
          />
        </div>
      </FocusTrap>
    </Scrim>
  );
}

export function EditUserScrim(props: {
  user?: IUserModel,
  visible: boolean,
  close(): void,
  save(user: IUserModel): Promise<void>,
}) {
  return (
    <Scrim
      key="editUserScrim"
      scrimStyles={SCRIM_STYLE.scrim}
      isVisible={props.visible}
      onBackgroundClick={props.close}
    >
      <FocusTrap
        focusTrapOptions={{
          clickOutsideDeactivates: true,
        }}
      >
        <div
          key="editUserContainer"
          tabIndex={0}
          {...css(SCRIM_STYLE.popup, {position: 'relative', width: 450})}
        >
          <EditUsers
            userToEdit={props.user}
            onClickDone={props.save}
            onClickClose={props.close}
          />
        </div>
      </FocusTrap>
    </Scrim>
  );
}

export function EditYouTubeScrim(props: {
  user?: IUserModel,
  visible: boolean,
  close(): void,
  save(user: IUserModel): Promise<void>,
}) {
  return (
    <Scrim
      key="editYouTubeScrim"
      scrimStyles={SCRIM_STYLE.scrim}
      isVisible={props.visible}
      onBackgroundClick={props.close}
    >
      <FocusTrap
        focusTrapOptions={{
          clickOutsideDeactivates: true,
        }}
      >
        <div
          key="editYouTubeContainer"
          tabIndex={0}
          {...css(SCRIM_STYLE.popup, {position: 'relative', width: '77vh'})}
        >
          <EditYouTubeUser
            user={props.user}
            onUserUpdate={props.save}
            onClickClose={props.close}
          />
        </div>
      </FocusTrap>
    </Scrim>
  );
}
