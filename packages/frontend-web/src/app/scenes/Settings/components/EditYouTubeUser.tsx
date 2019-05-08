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

import { Iterable } from 'immutable';
import React from 'react';

import {
  IconButton,
  Switch,
  Tooltip,
} from '@material-ui/core';
import {
  CheckCircleOutline,
} from '@material-ui/icons';

import { ICategoryModel, IUserModel } from '../../../../models';
import { ContainerHeader, OverflowContainer } from '../../../components/OverflowContainer';
import { GUTTER_DEFAULT_SPACING, PALE_COLOR, SCRIM_Z_INDEX } from '../../../styles';
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
});

export interface IEditYouTubeUserProps {
  onClickClose(e: React.FormEvent<any>): any;
  onUserUpdate(user: IUserModel): void;
  categories: Iterable.Indexed<ICategoryModel>;
  user?: IUserModel;
}

export function EditYouTubeUser(props: IEditYouTubeUserProps) {
  function onIsActiveChange() {
    const u = user.set('isActive', !user.isActive);
    props.onUserUpdate(u);
  }

  const {
    user,
    onClickClose,
  } = props;

  const hasError = !!user.extra.lastError;

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
            <Switch checked={user.isActive} color="primary" disabled={hasError} onChange={onIsActiveChange}/>
          </div>
          <div key="error" {...css(STYLES.row)}>
            <label {...css(STYLES.label)}>Last Error</label>
            <div>
              {hasError ? user.extra.lastError.message : 'No error'}
              {hasError &&
                <Tooltip title="Reset errors and reactivate" style={{marginLeft: '20px'}}>
                  <IconButton color="primary" onClick={onIsActiveChange}><CheckCircleOutline/></IconButton>
                </Tooltip>
              }
            </div>
          </div>
        </div>
      )}
    />
  );
}
