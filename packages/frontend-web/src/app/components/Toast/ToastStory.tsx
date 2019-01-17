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

import { action } from '@storybook/addon-actions';
import { storiesOf } from '@storybook/react';

import {
  ARTICLE_CATEGORY_TYPE,
  ARTICLE_HEADLINE_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  DIVIDER_COLOR,
  HEADLINE_TYPE,
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
} from '../../styles';
import { css } from '../../utilx';
import {
  ApproveIcon,
  RefreshIcon,
} from '../Icons';
import { Toast } from '../Toast';
import { ToastMessage } from './ToastMessage';

const STORY_STYLES = {
  base: {
    padding: '50px 10px',
    background: DIVIDER_COLOR,
  },

  darkText: {
    ...ARTICLE_CATEGORY_TYPE,
    color: DARK_PRIMARY_TEXT_COLOR,
  },

  largeCount: {
    ...HEADLINE_TYPE,
  },

  smallText: {
    ...ARTICLE_CATEGORY_TYPE,
  },

  progress: {
    ...ARTICLE_HEADLINE_TYPE,
  },

  progressMargin: {
    marginTop: '10px',
  },
};

storiesOf('Toast', module)
  .add('base', () => {
    return (
      <div {...css(STORY_STYLES.base)}>
        <Toast backgroundColor={LIGHT_PRIMARY_TEXT_COLOR}>
          <div {...css(STORY_STYLES.darkText)}>
            CONTENT
          </div>
        </Toast>
      </div>
    );
  })
  .add('undo', () => {
    return (
      <div {...css(STORY_STYLES.base)}>
        <ToastMessage
          buttonLabel={'Undo'}
          onClick={action('action undid')}
        >
          <div key={'Undo'}>
            <div key="content" {...css(STORY_STYLES.largeCount)}>
              <ApproveIcon
                width={30}
                height={30}
                {...css({ fill: MEDIUM_COLOR })}
              />
               135
            </div>
            <div key="footer" {...css(STORY_STYLES.smallText)}>Comments approved</div>
          </div>
        </ToastMessage>
      </div>
    );
  })
  .add('refresh', () => {
    return (
      <div {...css(STORY_STYLES.base)}>
        <ToastMessage
          buttonLabel={'Refresh'}
          onClick={action('action undid')}
        >
          <div key={'Refresh'}>
            <div key="icon">
              <RefreshIcon key="icon" {...css({ fill: MEDIUM_COLOR })} /> Refresh
            </div>
            <div key="progress" {...css(STORY_STYLES.progress)}>
              <div>Approval rating in progress.</div>
              <div {...css(STORY_STYLES.progressMargin)}>75% complete.</div>
            </div>
          </div>
        </ToastMessage>
      </div>
    );
  });
