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

import React from 'react';
import { LIGHT_PRIMARY_TEXT_COLOR } from '../../styles';
import { css, stylesheet } from '../../utilx';
import {
  ApproveIcon,
  DeferIcon,
  HighlightIcon,
  RejectIcon,
  UndoIcon,
} from '../Icons';

const STYLES = stylesheet({
  circle: {
    height: '100%',
    width: '100%',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    height: 40,
    width: 40,
  },
  large: {
    height: 120,
    width: 120,
  },
});

export interface IConfirmationCircleProps {
  backgroundColor: string;
  action: string;
  size: number;
  iconSize?: number;
}

export class ConfirmationCircle extends React.PureComponent<IConfirmationCircleProps> {
  render() {
    const {
      backgroundColor,
      action,
      size,
      iconSize,
    } = this.props;

    return (
      <div
        id={action}
        {...css(STYLES.circle, {
          backgroundColor,
          ...(size ? { width: size, height: size } : {}),
        })}
      >
        { action === 'approve' && (
          <ApproveIcon
            role="alert"
            label="Approve"
            {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })}
            size={iconSize || 40}
          />
        )}
        { action === 'defer' && (
          <DeferIcon
            role="alert"
            label="Defer"
            {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })}
            size={iconSize || 40}
          />
        )}
        { action === 'highlight' && (
          <HighlightIcon
            role="alert"
            label="Highlight"
            {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })}
            size={iconSize || 40}
          />
        )}
        { action === 'reject' && (
          <RejectIcon
            role="alert"
            label="Reject"
            {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })}
            size={iconSize || 40}
          />
        )}
        { action === 'reset' && (
          <UndoIcon
            role="alert"
            label="Reset"
            {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })}
            size={iconSize || 40}
          />
        )}
      </div>
    );
  }
}
