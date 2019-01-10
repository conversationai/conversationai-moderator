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
import { List } from 'immutable';
import React from 'react';
import { IConfirmationAction } from '../../../types';
import {
  GUTTER_DEFAULT_SPACING,
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
} from '../../styles';
import { maybeCallback, partial } from '../../util';
import { css, stylesheet } from '../../utilx';
import { CommentActionButton } from '../CommentActionButton';
import { ConfirmationCircle } from '../ConfirmationCircle';

import {
  ApproveIcon,
  DeferIcon,
  HighlightIcon,
  RejectIcon,
} from '../Icons';

const STYLES = stylesheet({
  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },

  isVertical: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    width: `58px`,
  },

  toolTipWithTagsContainer: {
    width: 250,
  },

  toolTipWithTagsUl: {
    listStyle: 'none',
    margin: 0,
    padding: `${GUTTER_DEFAULT_SPACING}px 0`,
  },

  toolTipWithTagsButton: {
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 0,
    color: MEDIUM_COLOR,
    cursor: 'pointer',
    padding: '8px 20px',
    textAlign: 'left',
    width: '100%',

    ':hover': {
      backgroundColor: MEDIUM_COLOR,
      color: LIGHT_PRIMARY_TEXT_COLOR,
    },

    ':focus': {
      backgroundColor: MEDIUM_COLOR,
      color: LIGHT_PRIMARY_TEXT_COLOR,
    },
  },
});

export interface IModerateButtonsProps {
  hideLabel?: boolean;
  vertical?: boolean;
  darkOnLight?: boolean;
  onClick?(action: IConfirmationAction): any;
  containerSize?: number;
  activeButtons?: List<IConfirmationAction>;
  disabled?: boolean;
  requireReasonForReject?: boolean;
  onRejectWithTag?(): any;
}

export interface IModerateButtonsState {
  tooltipVisible: boolean;
}

export class ModerateButtons
  extends React.PureComponent<IModerateButtonsProps> {

  @autobind
  handleReject() {
    const {
      requireReasonForReject,
      onRejectWithTag,
      onClick,
    } = this.props;
    if (requireReasonForReject) {
      onRejectWithTag();

      return;
    }

    onClick('reject');
  }

  render() {
    const {
      vertical,
      darkOnLight,
      hideLabel,
      containerSize,
      activeButtons,
      disabled,
      onClick,
    } = this.props;

    const ICON_COLOR = (vertical || darkOnLight) ? MEDIUM_COLOR : LIGHT_PRIMARY_TEXT_COLOR;

    const buttonContainerSize = containerSize || 48;

    return (
      <div
        {...css(
          STYLES.container,
          vertical && STYLES.isVertical,
        )}
      >
        <CommentActionButton
          label="Approve"
          isActive={activeButtons && activeButtons.includes('approve')}
          hideLabel={hideLabel || vertical}
          disabled={disabled}
          icon={(
            <ApproveIcon
              {...css({
                fill: ICON_COLOR,
                width: `${buttonContainerSize / 2}px`,
                height: `${buttonContainerSize / 2}px`,
              })}
            />
          )}
          style={{
            width: buttonContainerSize + 10,
            height: buttonContainerSize + 10,
            padding: `5px 0px`,
          }}
          iconHovered={(
            <ConfirmationCircle
              backgroundColor={ICON_COLOR}
              action="approve"
              size={buttonContainerSize}
              iconSize={buttonContainerSize / 2}
            />
          )}
          onClick={partial(maybeCallback(onClick), 'approve')}
        />

        <CommentActionButton
          label="Reject"
          isActive={activeButtons && activeButtons.includes('reject')}
          hideLabel={hideLabel || vertical}
          disabled={disabled}
          icon={(
            <RejectIcon
              {...css({
                fill: ICON_COLOR,
                width: `${buttonContainerSize / 2}px`,
                height: `${buttonContainerSize / 2}px`,
              })}
            />
          )}
          style={{
            width: buttonContainerSize + 10,
            height: buttonContainerSize + 10,
            padding: `5px 0px`,
          }}
          iconHovered={(
            <ConfirmationCircle
              backgroundColor={ICON_COLOR}
              action="reject"
              size={buttonContainerSize}
              iconSize={buttonContainerSize / 2}
            />
          )}
          onClick={this.handleReject}
        />

        <CommentActionButton
          label="Highlight"
          isActive={activeButtons && activeButtons.includes('highlight')}
          hideLabel={hideLabel || vertical}
          disabled={disabled}
          icon={(
            <HighlightIcon
              {...css({
                fill: ICON_COLOR,
                width: `${buttonContainerSize / 2}px`,
                height: `${buttonContainerSize / 2}px`,
              })}
            />
          )}
          style={{
            width: buttonContainerSize + 10,
            height: buttonContainerSize + 10,
            padding: `5px 0px`,
          }}
          iconHovered={(
            <ConfirmationCircle
              backgroundColor={ICON_COLOR}
              action="highlight"
              size={buttonContainerSize}
              iconSize={buttonContainerSize / 2}
            />
          )}
          onClick={partial(maybeCallback(onClick), 'highlight')}
        />

        <CommentActionButton
          label="Defer"
          isActive={activeButtons && activeButtons.includes('defer')}
          hideLabel={hideLabel || vertical}
          disabled={disabled}
          icon={(
            <DeferIcon
              {...css({
                fill: ICON_COLOR,
                width: `${buttonContainerSize / 2}px`,
                height: `${buttonContainerSize / 2}px`,
              })}
            />
          )}
          style={{
            width: buttonContainerSize + 10,
            height: buttonContainerSize + 10,
            padding: `5px 0px`,
          }}
          iconHovered={(
            <ConfirmationCircle
              backgroundColor={ICON_COLOR}
              action="defer"
              size={buttonContainerSize}
              iconSize={buttonContainerSize / 2}
            />
          )}
          onClick={partial(maybeCallback(onClick), 'defer')}
        />
      </div>
    );
  }
}
