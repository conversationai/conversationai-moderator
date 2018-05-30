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
import { IArticleModel, ICategoryModel, IUserModel } from '../../../../../models';
import { Button, CheckboxRow, OverflowContainer, RejectIcon } from '../../../../components';
import { css, partial, stylesheet } from '../../../../util';

import {
  DARK_COLOR,
  DARK_PRIMARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  HEADLINE_TYPE,
  PALE_COLOR,
} from '../../../../styles';

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

  h1: {
    ...HEADLINE_TYPE,
    margin: 0,
    color: DARK_PRIMARY_TEXT_COLOR,
  },

  closeButton: {
    background: 'none',
    border: 'none',
    position: 'absolute',
    right: GUTTER_DEFAULT_SPACING,
    top: GUTTER_DEFAULT_SPACING,
    cursor: 'pointer',
    ':focus': {
      outline: 'none',
      background: PALE_COLOR,
    },
  },
});

export interface IContainerHeaderProps {
  label: string;
  onClickClose: React.EventHandler<any>;
}

class ContainerHeader extends React.Component<IContainerHeaderProps> {
  render() {
    const { label, onClickClose } = this.props;

    return (
      <div>
        <h1 {...css(STYLES.h1)}>{label}</h1>
        <button key="close button" {...css(STYLES.closeButton)} aria-label="Close" onClick={onClickClose}>
          <RejectIcon style={{fill: DARK_COLOR}} />
        </button>
      </div>
    );
  }
}

export type ModelId = string | number;

export interface IModeratorListProps {
  users: List<IUserModel>;
  moderatorIds: Set<ModelId>;
  onModeratorStatusChange?(userId: string, checked: boolean): void;
}

class ModeratorList extends React.Component<IModeratorListProps> {
  render() {
    const {
      users,
      moderatorIds,
      onModeratorStatusChange,
    } = this.props;

    return (
      <ul {...css(STYLES.list)}>
        {users.map((user) => {
          const isSelected = moderatorIds && moderatorIds.includes(user.id);

          return (
            <li {...css(STYLES.listItem)} key={user.id}>
              <CheckboxRow
                label={user.name}
                user={user}
                isSelected={isSelected}
                onChange={partial(onModeratorStatusChange, user.id, isSelected)}
              />
            </li>
          );
        })}
      </ul>
    );
  }
}

export interface IContainerFooterProps {
  onClickButton?(): any;
}

class ContainerFooter extends React.Component<IContainerFooterProps> {
  render() {
    const { onClickButton } = this.props;

    return (
      <Button label="Save" onClick={onClickButton} />
    );
  }
}

export interface IAssignModeratorsProps {
  article?: IArticleModel;
  category?: ICategoryModel;
  users?: List<IUserModel>;
  moderatorIds?: Set<ModelId>;
  isReady?: boolean;
  label: string;
  onClickDone?(assignment: ICategoryModel | IArticleModel,  moderators: Array<IUserModel>): void;
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
      isReady,
    } = this.props;

    if (!isReady) {
      return null;
    }

    return (
      <OverflowContainer
        header={<ContainerHeader label={label} onClickClose={this.onClickClose} />}
        body={(
          <div {...css({ marginTop: `${GUTTER_DEFAULT_SPACING}px`, marginBottom: `${GUTTER_DEFAULT_SPACING}px`, })}>
            <ModeratorList
              users={this.state.users}
              moderatorIds={moderatorIds}
              onModeratorStatusChange={this.onModeratorStatusChange}
            />
          </div>
        )}
        footer={<ContainerFooter onClickButton={this.onClickDone} />}
      />
    );
  }

  @autobind
  onModeratorStatusChange(userid: string, checked: boolean) {
    if (checked && this.props.onAddModerator) {
      this.props.onRemoveModerator(userid);
    } else if (!checked && this.props.onRemoveModerator) {
      this.props.onAddModerator(userid);
    }
  }

  @autobind
  onClickClose() {
    this.props.onClickClose();
  }

  @autobind
  onClickDone() {
    const { article, category, users, moderatorIds, onClickDone} = this.props;
    onClickDone(
      category ? category : article,
      moderatorIds
          .map((id) => users.find((u) => u.id === id)).toArray(),
    );
  }
}
