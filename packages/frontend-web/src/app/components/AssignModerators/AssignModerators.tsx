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

import { Set } from 'immutable';
import React, { useState } from 'react';
import PerfectScrollbar from 'react-perfect-scrollbar';

import { IUserModel, ModelId } from '../../../models';
import { css, stylesheet } from '../../utilx';

import {
  GUTTER_DEFAULT_SPACING,
} from '../../styles';
import { Avatar } from '../Avatar';
import { CheckboxRow, GOOD_IMAGE_SIZE } from '../CheckboxRow/CheckboxRow';
import { ContainerFooter, ContainerHeader, OverflowContainer } from '../OverflowContainer';

const STYLES = stylesheet({
  list: {
    listStyle: 'none',
    margin: 0,
    height: 280,
    paddingTop: 0,
    paddingLeft: 0,
    paddingRight: `${GUTTER_DEFAULT_SPACING / 2}px`,
    paddingBottom: 0,
  },

  listItem: {
    textDecoration: 'none',
    ':focus': {
      outline: 'none',
      textDecoration: 'underline',
    },
  },
});

function ModeratorListItem(props: {
  user: IUserModel,
  moderatorIds: Set<ModelId>;
  categoryModeratorIds?: Set<ModelId>;
  onModeratorStatusChange?(userId: string, checked: boolean): void;
}) {
  const {
    user,
    moderatorIds,
    categoryModeratorIds,
    onModeratorStatusChange,
  } = props;

  const isDisabled = categoryModeratorIds && categoryModeratorIds.includes(user.id);
  const isSelected = moderatorIds && moderatorIds.includes(user.id) || isDisabled;
  function onChange(userId: ModelId) {
    onModeratorStatusChange(userId, isSelected);
  }

  return (
    <li {...css(STYLES.listItem)} key={user.id}>
      <CheckboxRow
        label={user.name}
        value={user.id}
        image={<Avatar size={GOOD_IMAGE_SIZE} target={user}/>}
        isSelected={isSelected}
        isDisabled={isDisabled}
        onChange={onChange}
      />
    </li>
  );
}

function ModeratorList(props: {
  users: Array<IUserModel>;
  moderatorIds: Set<ModelId>;
  categoryModeratorIds?: Set<ModelId>;
  onModeratorStatusChange?(userId: string, checked: boolean): void;
}) {
  const {
    users,
    moderatorIds,
    categoryModeratorIds,
    onModeratorStatusChange,
  } = props;

  return (
    <PerfectScrollbar>
      <ul {...css(STYLES.list)}>
        {users.map((user) => (
          <ModeratorListItem
            key={user.id}
            user={user}
            moderatorIds={moderatorIds}
            categoryModeratorIds={categoryModeratorIds}
            onModeratorStatusChange={onModeratorStatusChange}
          />
        ))}
      </ul>
    </PerfectScrollbar>
  );
}

export interface IAssignModeratorsProps {
  users?: Array<IUserModel>;
  moderatorIds?: Set<ModelId>;
  superModeratorIds?: Set<ModelId>;
  isReady?: boolean;
  label: string;
  onClickDone?(): void;
  onClickClose?(): void;
  onAddModerator?(userId: string): any;
  onRemoveModerator?(userId: string): any;
}

export function AssignModerators(props: IAssignModeratorsProps) {
  const [users, ] = useState(props.users);

  const {
    label,
    moderatorIds,
    superModeratorIds,
    isReady,
    onClickClose,
    onClickDone,
  } = props;

  if (!isReady) {
    return null;
  }

  function onModeratorStatusChange(userid: string, checked: boolean) {
    if (checked && props.onAddModerator) {
      props.onRemoveModerator(userid);
    }
    else if (!checked && props.onRemoveModerator) {
      props.onAddModerator(userid);
    }
  }

  return (
    <OverflowContainer
      header={<ContainerHeader onClickClose={onClickClose}>{label}</ContainerHeader>}
      body={(
        <div {...css({ marginTop: `${GUTTER_DEFAULT_SPACING}px`, marginBottom: `${GUTTER_DEFAULT_SPACING}px`, })}>
          <ModeratorList
            users={users}
            moderatorIds={moderatorIds}
            categoryModeratorIds={superModeratorIds}
            onModeratorStatusChange={onModeratorStatusChange}
          />
        </div>
      )}
      footer={<ContainerFooter onClick={onClickDone} />}
    />
  );
}
