/*
Copyright 2020 Google Inc.

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

import {List} from 'immutable';
import {generate} from 'randomstring';
import React, {useEffect, useState} from 'react';
import {useDispatch, useSelector} from 'react-redux';

import {
  IconButton,
  Tooltip,
} from '@material-ui/core';
import {
  Edit,
} from '@material-ui/icons';

import {
  IUserModel,
  ModelId,
} from '../../../models';
import {IAppDispatch, IAppState} from '../../appstate';
import {
  HeaderBar,
  Scrim,
} from '../../components';
import {API_URL} from '../../config';
import {
  getOAuthConfig,
  IApiConfiguration,
  kickProcessor,
  listSystemUsers,
  updateOAuthConfig,
} from '../../platform/dataService';
import {getToken} from '../../platform/localStore';
import {
  getSystemUsers,
  getUsers,
  systemUsersLoaded,
  USER_GROUP_GENERAL,
  USER_GROUP_MODERATOR,
  USER_GROUP_SERVICE,
  USER_GROUP_YOUTUBE,
} from '../../stores/users';
import {setCSRF} from '../../util';
import {css} from '../../utilx';
import {SettingsSubheaderBar} from '../Comments/components/SubheaderBar';
import {EditOAuthScrim} from './components/OAuthConfig';
import {
  AddUserScrim,
  EditUserScrim,
  EditYouTubeScrim,
  ModeratorSettings,
  ServiceUserSettings,
  UserSettings,
  YouTubeUsersSettings,
} from './components/users';
import {addUser, modifyUser} from './store';

import {
  SCRIM_STYLE,
  VISUALLY_HIDDEN,
} from '../../styles';
import { SETTINGS_STYLES } from './settingsStyles';
import {STYLES} from './styles';

function StatusScrim(props: {visible: boolean, submitStatus: string}) {
  return (
    <Scrim
      key="statusScrim"
      scrimStyles={SCRIM_STYLE.scrim}
      isVisible={props.visible}
    >
      <div {...css(SCRIM_STYLE.popup, {position: 'relative', width: 450})} tabIndex={0}>
        <p>{props.submitStatus}</p>
      </div>
    </Scrim>
  );
}

export async function loadSystemUsers(dispatch: IAppDispatch, type: string): Promise<List<IUserModel>> {
  const result = await listSystemUsers(type);
  await dispatch(systemUsersLoaded({type, users: result}));
  return result;
}

export function Settings(_props: {}) {
  const [visibleScrim, setVisibleScrim] = useState<'add_user' | 'edit_user' | 'edit_youtube' | 'oauth' | 'status' | null>(null);
  const [submitStatus, setSubmitStatus] = useState<string | null>(null);
  const [addUserType, setAddUserType] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<IUserModel | null>(null);
  const [oauthConfig, setOauthConfig] = useState<IApiConfiguration | null>(null);
  const dispatch = useDispatch();

  const users = useSelector(getUsers);
  const serviceUsers = useSelector((state: IAppState) => getSystemUsers(USER_GROUP_SERVICE, state));
  const moderatorUsers = useSelector((state: IAppState) => getSystemUsers(USER_GROUP_MODERATOR, state));
  const youtubeUsers = useSelector((state: IAppState) => getSystemUsers(USER_GROUP_YOUTUBE, state));

  useEffect(() => {
    loadSystemUsers(dispatch, USER_GROUP_SERVICE);
    loadSystemUsers(dispatch, USER_GROUP_MODERATOR);
    loadSystemUsers(dispatch, USER_GROUP_YOUTUBE);
  }, []);

  useEffect(() => {
    if (visibleScrim === 'status') {
      setVisibleScrim(null);
    }
  }, [users, youtubeUsers]);

  function handleAddUser(type: string, event: React.FormEvent<any>) {
    event.preventDefault();
    setAddUserType(type);
    setVisibleScrim('add_user');
  }

  function handleAddUserGeneral(event: React.FormEvent<any>) {
    handleAddUser(USER_GROUP_GENERAL, event);
  }

  function handleAddUserService(event: React.FormEvent<any>) {
    handleAddUser(USER_GROUP_SERVICE, event);
  }

  function handleEditUser(userId: ModelId) {
    let user = users.get(userId);
    if (!user) {
      user = serviceUsers.find((u) => (u.id === userId));
    }

    setSelectedUser(user);
    setVisibleScrim('edit_user');
  }

  function handleEditYoutube(userId: ModelId) {
    const user = youtubeUsers.find((u) => (u.id === userId));
    setSelectedUser(user);
    setVisibleScrim('edit_youtube');
  }

  async function handleEditOAuth() {
    const config = await getOAuthConfig();
    setVisibleScrim('oauth');
    setOauthConfig(config);
  }

  function closeScrims() {
    setVisibleScrim(null);
  }

  async function saveAddedUser(user: IUserModel) {
    setVisibleScrim('status');
    setSubmitStatus('Saving changes...');

    try {
      await addUser(user);
      if (user.group === USER_GROUP_SERVICE) {
        loadSystemUsers(dispatch, USER_GROUP_SERVICE);
        setVisibleScrim(null);
      }
      else {
        setSubmitStatus('Waiting for refresh...');
      }
    }
    catch (e) {
      setSubmitStatus(`There was an error saving your changes. Please reload and try again. Error: ${e.message}`);
    }
  }

  async function saveEditedUser(user: IUserModel) {
    setVisibleScrim('status');
    setSubmitStatus('Saving changes...');

    try {
      await modifyUser(user);
      if (user.group === USER_GROUP_SERVICE) {
        loadSystemUsers(dispatch, USER_GROUP_SERVICE);
        setVisibleScrim(null);
      }
      else {
        setSubmitStatus('Waiting for refresh...');
      }
    }
    catch (e) {
      setSubmitStatus(`There was an error saving your changes. Please reload and try again. Error: ${e.message}`);
    }
  }

  async function saveYouTubeSettings(user: IUserModel) {
    try {
      const userId = user.id;
      await modifyUser(user);
      const updatedUsers = await loadSystemUsers(dispatch, USER_GROUP_YOUTUBE);
      user = updatedUsers.find((u) => (u.id === userId));
      setSelectedUser(user);
    }
    catch (e) {
      setVisibleScrim('status');
      setSubmitStatus(`There was an error saving your changes. Please reload and try again. Error: ${e.message}`);
    }
  }

  async function saveOAuthSettings(config: IApiConfiguration) {
    setVisibleScrim('status');
    setSubmitStatus('Saving changes...');

    try {
      await updateOAuthConfig(config);
      setVisibleScrim(null);
    }
    catch (e) {
      setVisibleScrim('status');
      setSubmitStatus(`There was an error saving your changes. Please reload and try again. Error: ${e.message}`);
    }
  }

  function connectYouTubeAccount() {
    const csrf = generate();
    setCSRF(csrf);
    const token = getToken();
    window.location.href =  `${API_URL}/youtube/connect?&csrf=${csrf}&token=${token}`;
  }

  async function kickYouTubeProcessor() {
    setVisibleScrim('status');
    setSubmitStatus('Backend processor starting....');
    await kickProcessor('youtube');
    setSubmitStatus('Backend processor processing....');
    setTimeout(() => {
      setVisibleScrim(null);
      this.setState({
        isStatusScrimVisible: false,
      });
      loadSystemUsers(dispatch, USER_GROUP_YOUTUBE);
    }, 3000);
  }

  return (
    <div {...css(STYLES.base)}>
      <HeaderBar homeLink title="Settings"/>
      <SettingsSubheaderBar/>
      <div {...css(STYLES.body)}>
        <h1 {...css(VISUALLY_HIDDEN)}>Open Source Moderator Settings: Users and Services</h1>
        <UserSettings
          users={users}
          handleEdit={handleEditUser}
          handleAdd={handleAddUserGeneral}
        />
        <div key="serviceUsersHeader" {...css(SETTINGS_STYLES.heading)}>
          <h2 {...css(SETTINGS_STYLES.headingText)}>
            System accounts
          </h2>
        </div>
        <ServiceUserSettings
          users={serviceUsers}
          handleEdit={handleEditUser}
          handleAdd={handleAddUserService}
        />
        <ModeratorSettings users={moderatorUsers}/>
        <div key="pluginsHeader" {...css(SETTINGS_STYLES.heading)}>
          <h2 {...css(SETTINGS_STYLES.headingText)}>
            Plugins
          </h2>
        </div>
        <YouTubeUsersSettings
          users={youtubeUsers}
          handleEdit={handleEditYoutube}
          connect={connectYouTubeAccount}
          kick={kickYouTubeProcessor}
        />
        <div key="patformSettingsHeader" {...css(SETTINGS_STYLES.heading)}>
          <h2 {...css(SETTINGS_STYLES.headingText)}>
            Platform settings
          </h2>
        </div>
        <div {...css(SETTINGS_STYLES.section)}>
          <p>Configure OAuth:
            <Tooltip title="Edit this user">
              <IconButton onClick={handleEditOAuth}>
                <Edit color="primary"/>
              </IconButton>
            </Tooltip>
          </p>
        </div>
      </div>
      <StatusScrim
        visible={visibleScrim === 'status'}
        submitStatus={submitStatus}
      />
      <AddUserScrim
        type={addUserType}
        visible={visibleScrim === 'add_user'}
        close={closeScrims}
        save={saveAddedUser}
      />
      <EditUserScrim
        user={selectedUser}
        visible={visibleScrim === 'edit_user'}
        close={closeScrims}
        save={saveEditedUser}
      />
      <EditYouTubeScrim
        user={selectedUser}
        visible={visibleScrim === 'edit_youtube'}
        close={closeScrims}
        save={saveYouTubeSettings}
      />
      <EditOAuthScrim
        visible={visibleScrim === 'oauth'}
        config={oauthConfig}
        close={closeScrims}
        save={saveOAuthSettings}
      />
    </div>
  );
}
