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

import React from 'react';

import {
  HEADER_HEIGHT,
  LIGHT_PRIMARY_TEXT_COLOR,
  NICE_MIDDLE_BLUE,
  OFFSCREEN,
} from '../../styles';
import { maybeCallback } from '../../util';
import { css, stylesheet } from '../../utilx';
import { RejectIcon, SearchIcon, UserIcon } from '../Icons';

const STYLES = stylesheet({
  bar: {
    alignItems: 'center',
    background: NICE_MIDDLE_BLUE,
    boxSizing: 'border-box',
    display: 'flex',
    justifyContent: 'space-between',
    width: '100%',
    height: `${HEADER_HEIGHT + 12}px`,
  },

  button: {
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: HEADER_HEIGHT,
    width: HEADER_HEIGHT,
    ':hover': {
      borderBottom: '3px solid white',
    },
  },
  buttonSelected: {
    borderBottom: '3px solid white',
  },

  buttonText: {
    fontSize: '10px',
    color: LIGHT_PRIMARY_TEXT_COLOR,
  },

  childrenContainer: {
    display: 'flex',
    alignItems: 'center',
    height: '100%',
    flex: 1,
  },

  offscreen: OFFSCREEN,

  iconStyle: {
    fill: LIGHT_PRIMARY_TEXT_COLOR,
    borderBottom: '2px solid transparent',
  },

});

function HeaderItem(props: React.PropsWithChildren<{
  label: string,
  selected?: boolean,
  onClick(): void,
}>) {
  return (
    <button
      aria-label={props.label}
      {...css(STYLES.button, props.selected ? STYLES.buttonSelected : null)}
      onClick={props.onClick}
    >
      {props.children}
    </button>
    );
}

export function SearchHeader(props: React.PropsWithChildren<{
  searchByAuthor: boolean;
  setSearchByAuthor(value: boolean): void;
  cancelSearch(): void;
}>) {

  function setAuthor() {
    props.setSearchByAuthor(true);
  }

  function setText() {
    props.setSearchByAuthor(false);
  }

  return (
    <header role="banner">
      <div {...css(STYLES.bar)}>
        <div {...css(STYLES.childrenContainer)}>
          {props.children}
        </div>
        <HeaderItem
          label="Author search"
          selected={props.searchByAuthor}
          onClick={setAuthor}
        >
          <UserIcon key="icon" {...css(STYLES.iconStyle)} />
          <div key="text" {...css(STYLES.buttonText)}>Author</div>
        </HeaderItem>
        <HeaderItem
          label="Open comment search"
          selected={!props.searchByAuthor}
          onClick={maybeCallback(setText)}
        >
          <SearchIcon  key="icon" {...css(STYLES.iconStyle)} />
          <div key="text" {...css(STYLES.buttonText)}>Content</div>
        </HeaderItem>
        <HeaderItem
          label="Close search"
          onClick={props.cancelSearch}
        >
          <RejectIcon key="icon" {...css({fill: LIGHT_PRIMARY_TEXT_COLOR})} />
          <div key="text" {...css(STYLES.buttonText)}>Close</div>
        </HeaderItem>
      </div>
    </header>
  );
}
