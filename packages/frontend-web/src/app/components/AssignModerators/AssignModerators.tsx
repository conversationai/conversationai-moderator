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

import { autobind } from 'core-decorators';
import { List, Set } from 'immutable';
import React from 'react';
import { IUserModel } from '../../../models';
import { partial } from '../../util';
import { css, stylesheet } from '../../utilx';

import {
  GUTTER_DEFAULT_SPACING,
} from '../../styles';
import { CheckboxRow } from '../CheckboxRow';
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
    overflowY: 'scroll',
    WebkitOverflowScrolling: 'touch',
  },

  listItem: {
    textDecoration: 'none',
    ':focus': {
      outline: 'none',
      textDecoration: 'underline',
    },
  },
});

export type ModelId = string | number;

export interface IModeratorListProps {
  users: List<IUserModel>;
  moderatorIds: Set<ModelId>;
  categoryModeratorIds?: Set<ModelId>;
  onModeratorStatusChange?(userId: string, checked: boolean): void;
}

class ModeratorList extends React.Component<IModeratorListProps> {
  render() {
    const {
      users,
      moderatorIds,
      categoryModeratorIds,
      onModeratorStatusChange,
    } = this.props;

    return (
      <ul {...css(STYLES.list)}>
        {users.map((user) => {
          const isDisabled = categoryModeratorIds && categoryModeratorIds.includes(user.id);
          const isSelected = moderatorIds && moderatorIds.includes(user.id) || isDisabled;

          return (
            <li {...css(STYLES.listItem)} key={user.id}>
              <CheckboxRow
                label={user.name}
                user={user}
                isSelected={isSelected}
                isDisabled={isDisabled}
                onChange={partial(onModeratorStatusChange, user.id, isSelected)}
              />
            </li>
          );
        })}
      </ul>
    );
  }
}

export interface IAssignModeratorsProps {
  users?: List<IUserModel>;
  moderatorIds?: Set<ModelId>;
  superModeratorIds?: Set<ModelId>;
  isReady?: boolean;
  label: string;
  onClickDone?(): void;
  onClickClose?(): void;
  onAddModerator?(userId: string): any;
  onRemoveModerator?(userId: string): any;
}

export interface IAssignModeratorsState {
  users: List<IUserModel>;
}

export class AssignModerators
    extends React.Component<IAssignModeratorsProps, IAssignModeratorsState> {

  state: IAssignModeratorsState = {
    users: List<IUserModel>(),
  };

  componentDidMount() {
    if (this.props.users) {
      this.setState({
        users: this.props.users,
      });
    }
  }

  render() {
    const {
      label,
      moderatorIds,
      superModeratorIds,
      isReady,
      onClickClose,
      onClickDone,
    } = this.props;

    if (!isReady) {
      return null;
    }

    return (
      <OverflowContainer
        header={<ContainerHeader onClickClose={onClickClose}>{label}</ContainerHeader>}
        body={(
          <div {...css({ marginTop: `${GUTTER_DEFAULT_SPACING}px`, marginBottom: `${GUTTER_DEFAULT_SPACING}px`, })}>
            <ModeratorList
              users={this.state.users}
              moderatorIds={moderatorIds}
              categoryModeratorIds={superModeratorIds}
              onModeratorStatusChange={this.onModeratorStatusChange}
            />
          </div>
        )}
        footer={<ContainerFooter onClick={onClickDone} />}
      />
    );
  }

  @autobind
  onModeratorStatusChange(userid: string, checked: boolean) {
    if (checked && this.props.onAddModerator) {
      this.props.onRemoveModerator(userid);
    }
    else if (!checked && this.props.onRemoveModerator) {
      this.props.onAddModerator(userid);
    }
  }
}
