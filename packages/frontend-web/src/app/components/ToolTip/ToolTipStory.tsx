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
import React from 'react';
import {
  BOX_DEFAULT_SPACING,
  GUTTER_DEFAULT_SPACING,
  LIGHT_COLOR,
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
} from '../../styles';
import { css } from '../../utilx';
import { ToolTip } from '../ToolTip';

export interface IToolTipTagProps {
  tag?: string;
}

const GREY_COLOR = '#efefef';

const TARGET_POSITION = {
  left: 300,
  top: 300,
};

const CONTAINER_STYLES = {
  textWrapper: {
    padding: `${GUTTER_DEFAULT_SPACING}px`,
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: ('center' as 'center'),
    boxSizing: 'border-box',
    position: 'relative',
  },
};

const MULTIPLE_TAG_STYLES = {
  container: {
    width: 250,
  },
  ul: {
    margin: 0,
    padding: `${GUTTER_DEFAULT_SPACING}px 0`,
  },
  li: {
    listStyleType: 'none',
  },
  button: {
    borderRadius: 0,
    backgroundColor: 'transparent',
    border: 'none',
    color: MEDIUM_COLOR,
    padding: '8px 20px',
    width: '100%',
    textAlign: 'left',
    ':hover': {
      backgroundColor: MEDIUM_COLOR,
      color: LIGHT_PRIMARY_TEXT_COLOR,
    },
  },
};

const SINGLE_TAG_STYLES = {
  container: {
    width: 250,
  },
  label: {
    textAlign: 'center',
    color: LIGHT_PRIMARY_TEXT_COLOR,
  },
  button: {
    width: '50%',
    backgroundColor: MEDIUM_COLOR,
    color: LIGHT_PRIMARY_TEXT_COLOR,
    borderRadius: 0,
    padding: `${GUTTER_DEFAULT_SPACING}px`,
    border: 'none',
    marginBottom: `${GUTTER_DEFAULT_SPACING}px`,

    ':hover': {
      backgroundColor: LIGHT_COLOR,
    },
  },
};

const INFO_TOOLTIP_STYLES = {
  container: {
    color: MEDIUM_COLOR,
    margin: 0,
    padding: `${GUTTER_DEFAULT_SPACING}px`,
  },
  link: {
    listStyleType: 'none',
    margin: `${GUTTER_DEFAULT_SPACING}px ${BOX_DEFAULT_SPACING}px`,
  },
};

class ToolTipWithTag extends React.PureComponent<IToolTipTagProps> {
  render() {
    const { tag } = this.props;

    return (
      <div {...css(SINGLE_TAG_STYLES.container)}>
        <div {...css(CONTAINER_STYLES.textWrapper)}>
          <p {...css(SINGLE_TAG_STYLES.label)}>{tag}</p>
        </div>
        <div>
          <button
            key="yes"
            {...css(SINGLE_TAG_STYLES.button)}
            onClick={action('Yes')}
          >
            Yes
          </button>
          <button
            key="no"
            {...css(SINGLE_TAG_STYLES.button)}
            onClick={action('No')}
          >
            No
          </button>
        </div>
      </div>
    );
  }
}

class ToolTipWithTags extends React.PureComponent<object> {
  render() {
    return (
      <div {...css(MULTIPLE_TAG_STYLES.container)}>
        <ul {...css(MULTIPLE_TAG_STYLES.ul)}>
          <li {...css(MULTIPLE_TAG_STYLES.li)}>
            <button
              key="obscene"
              {...css(MULTIPLE_TAG_STYLES.button)}
              onClick={action('Obscene')}
            >
              Obscene
            </button>
          </li>
          <li {...css(MULTIPLE_TAG_STYLES.li)}>
            <button
              key="incoherent"
              {...css(MULTIPLE_TAG_STYLES.button)}
              onClick={action('Incoherent')}
            >
              Incoherent
            </button>
          </li>
          <li {...css(MULTIPLE_TAG_STYLES.li)}>
            <button
              key="spam"
              {...css(MULTIPLE_TAG_STYLES.button)}
              onClick={action('Spam')}
            >
              Spam
            </button>
          </li>
          <li {...css(MULTIPLE_TAG_STYLES.li)}>
            <button
              key="off-topic"
              {...css(MULTIPLE_TAG_STYLES.button)}
              onClick={action('Off-topic')}
            >
              Off-topic
            </button>
          </li>
          <li {...css(MULTIPLE_TAG_STYLES.li)}>
            <button
              key="inflammatory"
              {...css(MULTIPLE_TAG_STYLES.button)}
              onClick={action('Inflammatory')}
            >
              Inflammatory
            </button>
          </li>
          <li {...css(MULTIPLE_TAG_STYLES.li)}>
            <button
              key="unsubstantial"
              {...css(MULTIPLE_TAG_STYLES.button)}
              onClick={action('Unsubstantial')}
            >
              Unsubstantial
            </button>
          </li>
        </ul>
      </div>
    );
  }
}

class InfoToolTip extends React.PureComponent<object> {
  render() {
    return (
      <ul {...css(INFO_TOOLTIP_STYLES.container)}>
        <li {...css(INFO_TOOLTIP_STYLES.link)}>Keyboard Shortcuts</li>
        <li {...css(INFO_TOOLTIP_STYLES.link)}>Moderator Guidelines</li>
        <li {...css(INFO_TOOLTIP_STYLES.link)}>Submit Feedback</li>
      </ul>
    );
  }
}

const TARGET_STYLE = {
  backgroundColor: '#f00',
  borderRadius: '50%',
  height: '6px',
  left: TARGET_POSITION.left + 'px',
  position: 'absolute',
  top: TARGET_POSITION.top + 'px',
  transform: 'translate(-50%, -50%)',
  width: '6px',
};

class ToolTipTarget extends React.PureComponent<object> {
  render() {
    return (
      <div {...css(TARGET_STYLE)} />
    );
  }
}

storiesOf('ToolTip', module)
  .add('topLeft arrow (multiple tags)', () => {
    return (
      <div>
        <ToolTipTarget />
        <ToolTip
          backgroundColor={GREY_COLOR}
          arrowPosition="topLeft"
          size={16}
          isVisible
          position={{
            top: TARGET_POSITION.top,
            left: TARGET_POSITION.left,
          }}
        >
          <ToolTipWithTags />
        </ToolTip>
      </div>
    );
  })
  .add('topCenter arrow (single tag)', () => {
    return (
      <div>
        <ToolTipTarget />
        <ToolTip
          backgroundColor={MEDIUM_COLOR}
          arrowPosition="topCenter"
          size={16}
          isVisible
          position={{
            top: TARGET_POSITION.top,
            left: TARGET_POSITION.left,
          }}
        >
          <ToolTipWithTag tag="is this spam?" />
        </ToolTip>
      </div>
    );
  })
  .add('topRight arrow (single tag)', () => {
    return (
      <div>
        <ToolTipTarget />
        <ToolTip
          backgroundColor={MEDIUM_COLOR}
          arrowPosition="topRight"
          size={16}
          isVisible
          position={{
            top: TARGET_POSITION.top,
            left: TARGET_POSITION.left,
          }}
        >
          <ToolTipWithTag tag="is this spam?" />
        </ToolTip>
      </div>
    );
  })
  .add('rightTop arrow (single tag)', () => {
    return (
      <div>
        <ToolTipTarget />
        <ToolTip
          backgroundColor={MEDIUM_COLOR}
          arrowPosition="rightTop"
          size={16}
          isVisible
          position={{
            top: TARGET_POSITION.top,
            left: TARGET_POSITION.left,
          }}
        >
          <ToolTipWithTag tag="is this spam?" />
        </ToolTip>
      </div>
    );
  })
  .add('rightCenter arrow (single tag)', () => {
    return (
      <div>
        <ToolTipTarget />
        <ToolTip
          backgroundColor={MEDIUM_COLOR}
          arrowPosition="rightCenter"
          size={16}
          isVisible
          position={{
            top: TARGET_POSITION.top,
            left: TARGET_POSITION.left,
          }}
        >
          <ToolTipWithTag tag="is this spam?" />
        </ToolTip>
      </div>
    );
  })
  .add('rightBottom arrow (single tag)', () => {
    return (
      <div>
        <ToolTipTarget />
        <ToolTip
          backgroundColor={MEDIUM_COLOR}
          arrowPosition="rightBottom"
          size={16}
          isVisible
          position={{
            top: TARGET_POSITION.top,
            left: TARGET_POSITION.left,
          }}
        >
          <ToolTipWithTag tag="is this spam?" />
        </ToolTip>
      </div>
    );
  })
  .add('bottomRight arrow (single tag)', () => {
    return (
      <div>
        <ToolTipTarget />
        <ToolTip
          backgroundColor={MEDIUM_COLOR}
          arrowPosition="bottomRight"
          size={16}
          isVisible
          position={{
            top: TARGET_POSITION.top,
            left: TARGET_POSITION.left,
          }}
        >
          <ToolTipWithTag tag="is this spam?" />
        </ToolTip>
      </div>
    );
  })
  .add('bottomCenter arrow (single tag)', () => {
    return (
      <div>
        <ToolTipTarget />
        <ToolTip
          backgroundColor={MEDIUM_COLOR}
          arrowPosition="bottomCenter"
          size={16}
          isVisible
          position={{
            top: TARGET_POSITION.top,
            left: TARGET_POSITION.left,
          }}
        >
          <ToolTipWithTag tag="is this spam?" />
        </ToolTip>
      </div>
    );
  })
  .add('bottomLeft arrow (single tag)', () => {
    return (
      <div>
        <ToolTipTarget />
        <ToolTip
          backgroundColor={MEDIUM_COLOR}
          arrowPosition="bottomLeft"
          size={16}
          isVisible
          position={{
            top: TARGET_POSITION.top,
            left: TARGET_POSITION.left,
          }}
        >
          <ToolTipWithTag tag="is this spam?" />
        </ToolTip>
      </div>
    );
  })
  .add('leftBottom arrow (single tag)', () => {
    return (
      <div>
        <ToolTipTarget />
        <ToolTip
          backgroundColor={MEDIUM_COLOR}
          arrowPosition="leftBottom"
          size={16}
          isVisible
          position={{
            top: TARGET_POSITION.top,
            left: TARGET_POSITION.left,
          }}
        >
          <ToolTipWithTag tag="is this spam?" />
        </ToolTip>
      </div>
    );
  })
  .add('leftCenter arrow (single tag)', () => {
    return (
      <div>
        <ToolTipTarget />
        <ToolTip
          backgroundColor={MEDIUM_COLOR}
          arrowPosition="leftCenter"
          size={16}
          isVisible
          position={{
            top: TARGET_POSITION.top,
            left: TARGET_POSITION.left,
          }}
        >
          <ToolTipWithTag tag="is this spam?" />
        </ToolTip>
      </div>
    );
  })
  .add('leftTop arrow (single tag)', () => {
    return (
      <div>
        <ToolTipTarget />
        <ToolTip
          backgroundColor={MEDIUM_COLOR}
          arrowPosition="leftTop"
          size={16}
          isVisible
          position={{
            top: TARGET_POSITION.top,
            left: TARGET_POSITION.left,
          }}
        >
          <ToolTipWithTag tag="is this spam?" />
        </ToolTip>
      </div>
    );
  })
  .add('no arrow (single tag)', () => {
    return (
      <div>
        <ToolTipTarget />
        <ToolTip
          backgroundColor={MEDIUM_COLOR}
          arrowPosition={undefined}
          size={16}
          isVisible
          position={{
            top: TARGET_POSITION.top,
            left: TARGET_POSITION.left,
          }}
        >
          <ToolTipWithTag tag="is this spam?" />
        </ToolTip>
      </div>
    );
  })
  .add('info tooltip', () => {
    return (
      <div>
        <ToolTipTarget />
        <ToolTip
          backgroundColor={MEDIUM_COLOR}
          arrowPosition="leftCenter"
          size={16}
          isVisible
          position={{
            top: TARGET_POSITION.top,
            left: TARGET_POSITION.left,
          }}
        >
          <InfoToolTip />
        </ToolTip>
      </div>
    );
  });
