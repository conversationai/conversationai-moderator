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

import { storiesOf } from '@storybook/react';
import { action } from '@storybook/addon-actions';

import {
  DARK_PRIMARY_TEXT_COLOR,
  GUTTER_DEFAULT_SPACING,
  HEADER_HEIGHT,
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
} from '../../styles';
import { css } from '../../util';
import {
  ApproveIcon,
  DeferIcon,
  FlagIcon,
  HighlightIcon,
  RejectIcon,
} from '../Icons';
import { NavigationTab } from '../NavigationTab';

const STYLES = {
  mainDark: {
    background: MEDIUM_COLOR,
    display: 'inline-block',
  },

  mainLight: {
    display: 'inline-block',
  },

  button:  {
    background: 'transparent',
    border: 0,
    margin: 0,
    padding: 0,
    cursor: 'pointer',
  },
};

storiesOf('NavigationTab', module)
  .add('Default', () => (
    <div {...css(STYLES.mainDark)}>
      <button
        {...css(STYLES.button, { height: `${HEADER_HEIGHT}px` })}
        onClick={action('Nav Clicked')}
        aria-label="New"
      >
        <NavigationTab
          {...css({
            padding: `0 ${GUTTER_DEFAULT_SPACING}px`,
          })}
          label="New"
          count={542}
        />
      </button>
      <button
        {...css({ ...STYLES.button, height: `${HEADER_HEIGHT}px` })}
        onClick={action('Nav Clicked')}
        aria-label="Moderated"
      >
        <NavigationTab
          {...css({
            padding: `0 ${GUTTER_DEFAULT_SPACING}px`,
          })}
          label="Moderated"
          count={923}
        />
      </button>
    </div>
  ))
  .add('With Icons Light', () => (
    <div {...css(STYLES.mainLight)}>
      <button
        {...css(STYLES.button)}
        onClick={action('Nav Clicked')}
        aria-label="Approved"
      >
        <NavigationTab
          label="Approved"
          darkText
          count={25}
          icon={<ApproveIcon {...css({ fill: DARK_PRIMARY_TEXT_COLOR })} />}
        />
      </button>
      <button
        {...css(STYLES.button)}
        onClick={action('Nav Clicked')}
        aria-label="Highlight"
      >
        <NavigationTab
          label="Highlight"
          darkText
          count={25}
          icon={<HighlightIcon {...css({ fill: DARK_PRIMARY_TEXT_COLOR })} />}
        />
      </button>
      <button
        {...css(STYLES.button)}
        onClick={action('Nav Clicked')}
        aria-label="Rejected"
      >
        <NavigationTab
          label="Rejected"
          darkText
          count={25}
          icon={<RejectIcon {...css({ fill: DARK_PRIMARY_TEXT_COLOR })} />}
        />
      </button>
      <button
        {...css(STYLES.button)}
        onClick={action('Nav Clicked')}
        aria-label="Deferred"
      >
        <NavigationTab
          label="Deferred"
          darkText
          count={25}
          icon={<DeferIcon {...css({ fill: DARK_PRIMARY_TEXT_COLOR })} />}
        />
      </button>
      <button
        {...css(STYLES.button)}
        onClick={action('Nav Clicked')}
        aria-label="Flagged"
      >
        <NavigationTab
          label="Flagged"
          darkText
          count={25}
          icon={<FlagIcon {...css({ fill: DARK_PRIMARY_TEXT_COLOR })} />}
        />
      </button>
    </div>
  ))
  .add('With Icons Dark', () => (
    <div {...css(STYLES.mainDark)}>
      <button
        {...css(STYLES.button)}
        onClick={action('Nav Clicked')}
        aria-label="Approved"
      >
        <NavigationTab
          label="Approved"
          count={25}
          icon={<ApproveIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />}
        />
      </button>
      <button
        {...css(STYLES.button)}
        onClick={action('Nav Clicked')}
        aria-label="Highlight"
      >
        <NavigationTab
          label="Highlight"
          count={25}
          icon={<HighlightIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />}
        />
      </button>
      <button
        {...css(STYLES.button)}
        onClick={action('Nav Clicked')}
        aria-label="Rejected"
      >
        <NavigationTab
          label="Rejected"
          count={25}
          icon={<RejectIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />}
        />
      </button>
      <button
        {...css(STYLES.button)}
        onClick={action('Nav Clicked')}
        aria-label="Deferred"
      >
        <NavigationTab
          label="Deferred"
          count={25}
          icon={<DeferIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />}
        />
      </button>
      <button
        {...css(STYLES.button)}
        onClick={action('Nav Clicked')}
        aria-label="Flagged"
      >
        <NavigationTab
          label="Flagged"
          count={25}
          icon={<FlagIcon {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })} />}
        />
      </button>
    </div>
  ));
