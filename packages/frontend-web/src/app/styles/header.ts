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

// import { stylesheet } from '../util';
import { LIGHT_PRIMARY_TEXT_COLOR, MEDIUM_COLOR } from '../styles/colors';
import { ARTICLE_HEADLINE_TYPE } from '../styles/typography';
import { GUTTER_DEFAULT_SPACING } from '../styles/util';
import { ARTICLE_PREVIEW_Z_INDEX } from '../styles/zindex';

/*
 * Select element styles
 */
export const ARTICLE_HEADER = {
  header: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    justifyContent: 'space-between',
  },

  meta: {
    display: 'flex',
    alignItems: 'center',
    width: '50%',
    height: '100%',
    paddingLeft: 0,
    flex: 1,
  },

  title: {
    ...ARTICLE_HEADLINE_TYPE,
    color: LIGHT_PRIMARY_TEXT_COLOR,
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    lineHeight: 1.5,
    marginTop: 0,
    marginRight: 0,
    marginBottom: 0,
  },

  titleLink: {
    cursor: 'pointer',
    opacity: 1,
    transition: 'opacity 0.3 ease',
    ':hover': {
      transition: 'opacity 0.3 ease',
      opacity: 0.64,
    },
    ':focus': {
      outline: 0,
      opacity: 0.64,
      textDecoration: 'underline',
    },
  },

  articlePreviewScrim: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    zIndex: ARTICLE_PREVIEW_Z_INDEX,
  },

  articlePreviewWrapper: {
    position: 'absolute',
    width: 693,
  },

  tabs: {
    display: 'flex',
    height: '100%',
  },

  link: {
    textDecoration: 'none',
    transition: 'backgroundColor 0.3 ease',
    backgroundColor: 'transparent',
    display: 'flex',
    ':hover': {
      transition: 'backgroundColor 0.3 ease',
      backgroundColor: MEDIUM_COLOR,
    },
    ':focus': {
      outline: 0,
      color: LIGHT_PRIMARY_TEXT_COLOR,
      textDecoration: 'underline',
    },
  },

  tab: {
    padding: `0 ${GUTTER_DEFAULT_SPACING}px`,
    alignItems: 'center',
  },
};
