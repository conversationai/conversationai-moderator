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
import {
  ARTICLE_CATEGORY_TYPE,
  BOX_DEFAULT_SPACING,
  CAPTION_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  DARK_SECONDARY_TEXT_COLOR,
  LIGHT_PRIMARY_TEXT_COLOR,
  LIGHT_SECONDARY_TEXT_COLOR,
  SHORT_SCREEN_QUERY,
} from '../../styles';
import { css, stylesheet } from '../../util';

const STYLES = stylesheet({
  base: {
    position: 'relative',
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'stretch',
    width: 'auto',
  },

  hasIcon: {
    padding: '30px 32px 40px',
    [SHORT_SCREEN_QUERY]: {
        padding: '14px 22px 14px',
    },
  },

  row: {
    display: 'flex',
  },

  icon: {
    width: '100%',
    marginBottom: '10px',
    display: 'flex',
    justifyContent: 'center',
  },

  label: {
    ...ARTICLE_CATEGORY_TYPE,
    fontSize: '14px',
    color: LIGHT_PRIMARY_TEXT_COLOR,
  },

  darkLabel: {
    color: DARK_PRIMARY_TEXT_COLOR,
  },

  smallLabel: {
    ...CAPTION_TYPE,
  },

  count: {
    ...ARTICLE_CATEGORY_TYPE,
    fontSize: '14px',
    color: LIGHT_SECONDARY_TEXT_COLOR,
    marginLeft: `${BOX_DEFAULT_SPACING}px`,
  },

  darkCount: {
    color: DARK_SECONDARY_TEXT_COLOR,
  },

  disable: {
    opacity: 0.5,
  },

  isFocused: {
    borderBottom: '2px solid white',
  },
});

export interface INavigationTabProps {
  style?: object;
  label: string;
  count: number;
  icon?: JSX.Element;
  darkText?: boolean;
  isFocused?: boolean;
}

export class NavigationTab
    extends React.PureComponent<INavigationTabProps> {

  render() {
    const { label, count, icon, darkText, style, isFocused } = this.props;
    const hasIcon = !!icon;
    const dark = darkText;

    return(
      <div
        {...css(
          STYLES.base,
          hasIcon && STYLES.hasIcon,
          style,
        )}
      >
        {icon && <div {...css(STYLES.icon)}>{icon}</div>}
        <div {...css(STYLES.row)}>
          <div
            {...css(
              STYLES.label,
              dark && STYLES.darkLabel,
              hasIcon && STYLES.smallLabel,
              isFocused && STYLES.isFocused,
            )}
          >
            {label}
          </div>
          <div
            {...css(
              STYLES.count,
              dark && STYLES.darkCount,
              hasIcon && STYLES.smallLabel,
            )}
          >
            {count}
          </div>
        </div>
      </div>
    );
  }
}
