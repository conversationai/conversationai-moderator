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

import React from 'react';
import {useSelector} from 'react-redux';

import {
  CircularProgress,
  IconButton,
  Switch,
  Tooltip,
} from '@material-ui/core';
import {
  CheckCircleOutline,
  Sync,
} from '@material-ui/icons';

import { ICategoryModel, IUserModel } from '../../../../models';
import { ContainerHeader, OverflowContainer } from '../../../components/OverflowContainer';
import { activateCommentSource, syncCommentSource } from '../../../platform/dataService';
import { getCategories } from '../../../stores/categories';
import { flexCenter, GUTTER_DEFAULT_SPACING, PALE_COLOR, SCRIM_Z_INDEX } from '../../../styles';
import { css, stylesheet } from '../../../utilx';

const STYLES = stylesheet({
  heading: {
    fontSize: '18px',
  },

  subheading: {
    fontSize: '16px',
    marginTop: `${36}px`,
  },

  headerRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  row: {
    marginTop: `${12}px`,
    marginBottom: `${12}px`,
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'center',
  },

  label: {
    fontWeight: 'bold',
    marginRight: '24px',
    minWidth: '120px',
    display: 'flex',
    alignItems: 'left',
  },

  closeButton: {
    background: 'none',
    border: 'none',
    position: 'absolute',
    right: GUTTER_DEFAULT_SPACING,
    top: GUTTER_DEFAULT_SPACING,
    cursor: 'pointer',
    zIndex: SCRIM_Z_INDEX,
    ':focus': {
      outline: 'none',
      background: PALE_COLOR,
    },
  },

  userTableCell: {
    textAlign: 'left',
    padding: '5px 20px 5px 0',
  },

  userTableCellButton: {
    width: '49px',
    height: '49px',
    ...flexCenter,
  },
});

interface IYoutubeCategoryProps {
  category: ICategoryModel;
}

function YoutubeCategory(props: IYoutubeCategoryProps) {
  const {
    category,
  } = props;

  const [changingActive, setChangingActive] = React.useState<boolean>(false);
  const [syncingComments, setSyncingComments] = React.useState<boolean>(false);

  async function activate() {
    setChangingActive(true);
    await activateCommentSource(category.id, !category.isActive);
    setChangingActive(false);
  }

  async function sync() {
    setSyncingComments(true);
    await syncCommentSource(category.id);
    setTimeout(() => setSyncingComments(false), 3000);
  }

  return (
    <tr>
      <td key="label" {...css(STYLES.userTableCell)}>{category.label}</td>
      <td key="source" {...css(STYLES.userTableCell)}>{category.sourceId}</td>
      <td key="active" {...css(STYLES.userTableCell)}>
        <Tooltip
          title={category.isActive ? 'Comments will sync every 5 minute' : 'Automatic comment sync is disabled'}
        >
          <Switch color="primary" checked={category.isActive} onChange={activate} disabled={changingActive}/>
        </Tooltip>
      </td>
      <td key="actions" {...css(STYLES.userTableCell)}>
        <div {...css(STYLES.userTableCellButton)}>
          <Tooltip title="Load recent articles and comments">
            {syncingComments ?
              <CircularProgress color="primary" size={30}/> :
              <IconButton onClick={sync}><Sync/></IconButton>
            }
          </Tooltip>
        </div>
      </td>
    </tr>
  );
}

export interface IEditYouTubeUserProps {
  onClickClose(e: React.FormEvent<any>): any;
  onUserUpdate(user: IUserModel): Promise<void>;
  user?: IUserModel;
}

export function EditYouTubeUser(props: IEditYouTubeUserProps) {
  const [changingActive, setChangingActive] = React.useState<boolean>(false);

  async function onIsActiveChange() {
    setChangingActive(true);
    await props.onUserUpdate({...user, isActive: !user.isActive});
    setChangingActive(false);
  }

  const {
    user,
    onClickClose,
  } = props;

  const hasError = !!user.extra.lastError;
  const categories = useSelector(getCategories);
  const relevant = categories.filter((c) => c.ownerId === user.id);

  return (
    <OverflowContainer
      header={<ContainerHeader onClickClose={onClickClose}>Settings for YouTube account</ContainerHeader>}
      body={(
        <div>
          <div key="name" {...css(STYLES.row)}>
            <label {...css(STYLES.label)}>Youtube Name</label>
            <div>{user.name}</div>
          </div>
          <div key="email" {...css(STYLES.row)}>
            <label {...css(STYLES.label)}>Youtube ID</label>
            <div>{user.email}</div>
          </div>
          <div key="active" {...css(STYLES.row)}>
            <label {...css(STYLES.label)}>Is Active</label>
            <div  style={{position: 'relative'}}>
              <Switch
                checked={user.isActive}
                color="primary"
                disabled={hasError || changingActive}
                onChange={onIsActiveChange}
              />
            </div>
          </div>
          <div key="error" {...css(STYLES.row)}>
            <label {...css(STYLES.label)}>Last Error</label>
            <div>
              {hasError ? user.extra.lastError.message : 'No error'}
              {hasError && (
                <Tooltip title="Reset errors and reactivate" style={{marginLeft: '20px'}}>
                  <IconButton color="primary" onClick={onIsActiveChange}><CheckCircleOutline/></IconButton>
                </Tooltip>
              )}
            </div>
          </div>
          <h2 key="channelTitle" {...css(STYLES.subheading)}>Channels</h2>
          <table>
            <thead>
            <tr>
              <th key="1" {...css(STYLES.userTableCell)}>
                Name
              </th>
              <th key="2" {...css(STYLES.userTableCell)}>
                YouTube ID
              </th>
              <th key="3" {...css(STYLES.userTableCell)}>
                Is Active
              </th>
            </tr>
            </thead>
            <tbody>
              {relevant.map((c) => (<YoutubeCategory key={c.id} category={c}/>))}
            </tbody>
          </table>
          <p style={{marginTop: `${31}px`}}>
            Activating moderation of a YouTube channel puts it into post-moderation mode.
            Comments will not be visible to users until you mark them as approved.
          </p>
          <p>
            Syncing history data will make sure the last few hundred comments are available
            in Moderator, even if they've already been published.
          </p>
        </div>
      )}
    />
  );
}
