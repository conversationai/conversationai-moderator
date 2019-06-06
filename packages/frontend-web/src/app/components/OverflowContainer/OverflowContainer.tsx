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

import React, { MouseEvent,  ReactNode } from 'react';

import {
  Button,
} from '@material-ui/core';
import {
  Close,
} from '@material-ui/icons';

import {
  ARTICLE_HEADLINE_TYPE,
  BODY_TEXT_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  HEADLINE_TYPE,
} from '../../styles';
import { css, stylesheet } from '../../utilx';

const STYLES = stylesheet({
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
  },

  header: {
    ...HEADLINE_TYPE,
    color: DARK_PRIMARY_TEXT_COLOR,
  },

  body: {
    ...BODY_TEXT_TYPE,
    flex: '1 1 auto',
    overflowY: 'auto',
    WebkitOverflowScrolling: 'touch',
    overflowX: 'hidden',
    marginLeft: 0,
    marginRight: 0,
    padding: 0,
    minHeight: 0,
    color: DARK_PRIMARY_TEXT_COLOR,
  },

  footer: {
    ...ARTICLE_HEADLINE_TYPE,
    color: DARK_PRIMARY_TEXT_COLOR,
  },

  h1: {
    ...HEADLINE_TYPE,
    margin: 0,
    color: DARK_PRIMARY_TEXT_COLOR,
  },

  closeButtonContainer: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  saveButtonContainer: {
    textAlign: 'right',
  },
});

export interface IContainerHeaderProps {
  children?: ReactNode;
  onClickClose: React.EventHandler<any>;
}

export function ContainerHeader(props: IContainerHeaderProps) {
  const { children, onClickClose } = props;

  return (
    <div {...css(STYLES.closeButtonContainer)}>
      <h1 key="label" {...css(STYLES.h1)}>{children}</h1>
      <Close onClick={onClickClose}/>
    </div>
  );
}

export interface IContainerFooterProps {
  onClick(): void;
  disabled?: boolean;
}

export function ContainerFooter(props: IContainerFooterProps) {
  const { onClick, disabled } = props;

  function onClickWrapper(e: MouseEvent) {
    e.preventDefault();
    onClick();
  }

  return (
    <div {...css(STYLES.saveButtonContainer)}>
      <Button variant="contained" color="primary" disabled={disabled} onClick={onClickWrapper}>Save</Button>
    </div>
  );
}

export interface IOverflowContainerProps {
  header?: JSX.Element;
  body: JSX.Element;
  footer?: JSX.Element;
}

export class OverflowContainer extends React.PureComponent<IOverflowContainerProps> {
  render() {
    const {
      header,
      body,
      footer,
    } = this.props;

    return (
      <div {...css(STYLES.container)}>
        <div {...css(STYLES.header)}>
          {header}
        </div>
        <div {...css(STYLES.body)}>
          {body}
        </div>
        <div {...css(STYLES.footer)}>
          {footer}
        </div>
      </div>
    );
  }
}
