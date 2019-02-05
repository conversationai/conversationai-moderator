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
import React from 'react';
import {
  BODY_TEXT_TYPE,
  TOOLTIP_Z_INDEX,
} from '../../styles';
import { css, stylesheet } from '../../utilx';

const BUFFER = 16;

const base = {
  width: 0,
  height: 0,
  position: 'absolute',
};

function makeArrowStyles(direction: string, color: string, size: number): any {
  let arrowStyles;

  if (direction === 'topLeft') {
    arrowStyles = {
      borderLeft: `${size}px solid transparent`,
      borderRight: `${size}px solid transparent`,
      borderBottom: `${size}px solid ${color}`,
      borderTop: 0,
      top: `-${size}px`,
      left: `${size}px`,
    };
  }

  if (direction === 'topCenter') {
    arrowStyles = {
      borderLeft: `${size}px solid transparent`,
      borderRight: `${size}px solid transparent`,
      borderBottom: `${size}px solid ${color}`,
      borderTop: 0,
      top: `-${size}px`,
      left: `calc(50% - ${size}px)`,
    };
  }

  if (direction === 'topRight') {
    arrowStyles = {
      borderLeft: `${size}px solid transparent`,
      borderRight: `${size}px solid transparent`,
      borderBottom: `${size}px solid ${color}`,
      borderTop: 0,
      top: `-${size}px`,
      right: `${size}px`,
    };
  }

  if (direction === 'rightTop') {
    arrowStyles = {
      borderLeft: `${size}px solid ${color}`,
      borderRight: 0,
      borderBottom: `${size}px solid transparent`,
      borderTop: `${size}px solid transparent`,
      right: `-${size}px`,
      top: `${size}px`,
    };
  }

  if (direction === 'rightCenter') {
    arrowStyles = {
      borderLeft: `${size}px solid ${color}`,
      borderRight: 0,
      borderBottom: `${size}px solid transparent`,
      borderTop: `${size}px solid transparent`,
      right: `-${size}px`,
      top: `calc(50% - ${size}px)`,
    };
  }

  if (direction === 'rightBottom') {
    arrowStyles = {
      borderLeft: `${size}px solid ${color}`,
      borderRight: 0,
      borderBottom: `${size}px solid transparent`,
      borderTop: `${size}px solid transparent`,
      right: `-${size}px`,
      bottom: `${size}px`,
    };
  }

  if (direction === 'bottomRight') {
    arrowStyles = {
      borderLeft: `${size}px solid transparent`,
      borderRight: `${size}px solid transparent`,
      borderBottom: 0,
      borderTop: `${size}px solid ${color}`,
      right: `${size}px`,
      bottom: `-${size}px`,
    };
  }

  if (direction === 'bottomCenter') {
    arrowStyles = {
      borderLeft: `${size}px solid transparent`,
      borderRight: `${size}px solid transparent`,
      borderBottom: 0,
      borderTop: `${size}px solid ${color}`,
      right: `calc(50% - ${size}px)`,
      bottom: `-${size}px`,
    };
  }

  if (direction === 'bottomLeft') {
    arrowStyles = {
      borderLeft: `${size}px solid transparent`,
      borderRight: `${size}px solid transparent`,
      borderBottom: 0,
      borderTop: `${size}px solid ${color}`,
      left: `${size}px`,
      bottom: `-${size}px`,
    };
  }

  if (direction === 'leftBottom') {
    arrowStyles = {
      borderLeft: 0,
      borderRight: `${size}px solid ${color}`,
      borderBottom: `${size}px solid transparent`,
      borderTop: `${size}px solid transparent`,
      left: `-${size}px`,
      bottom: `${size}px`,
    };
  }

  if (direction === 'leftCenter') {
    arrowStyles = {
      borderLeft: 0,
      borderRight: `${size}px solid ${color}`,
      borderBottom: `${size}px solid transparent`,
      borderTop: `${size}px solid transparent`,
      left: `-${size}px`,
      bottom: `calc(50% - ${size}px)`,
    };
  }

  if (direction === 'leftTop') {
    arrowStyles = {
      borderLeft: 0,
      borderRight: `${size}px solid ${color}`,
      borderBottom: `${size}px solid transparent`,
      borderTop: `${size}px solid transparent`,
      left: `-${size}px`,
      top: `${size}px`,
    };
  }

  return arrowStyles;
}

const makeArrow = (direction: string, color: string, size: number): React.CSSProperties => {
  return {
    ...base,
    ...makeArrowStyles(direction, color, size),
  };
};

function setTranslation(direction = 'topCenter', size: number) {
  let x = '0px';
  let y = '0px';

  if (direction === 'topLeft') {
    x = -(size * 2) + 'px';
    y = (size + BUFFER) + 'px';
  }

  if (direction === 'topCenter') {
    x = '-50%';
    y = (size + BUFFER) + 'px';
  }

  if (direction === 'topRight') {
    x = 'calc(-100% + ' + (size * 2) + 'px)';
    y = (size + BUFFER) + 'px';
  }

  if (direction === 'rightTop') {
    x = 'calc(-100% + ' + (-size - BUFFER) + 'px)';
    y = -(size * 2) + 'px';
  }

  if (direction === 'rightCenter') {
    x = 'calc(-100% + ' + (-size - BUFFER) + 'px)';
    y = '-50%';
  }

  if (direction === 'rightBottom') {
    x = 'calc(-100% + ' + (-size - BUFFER) + 'px)';
    y = 'calc(-100% + ' + (size * 2) + 'px)';
  }

  if (direction === 'bottomRight') {
    x = 'calc(-100% + ' + (size * 2) + 'px)';
    y = 'calc(-100% + ' + (-size - BUFFER) + 'px)';
  }

  if (direction === 'bottomCenter') {
    x = '-50%';
    y = 'calc(-100% + ' + (-size - BUFFER) + 'px)';
  }

  if (direction === 'bottomLeft') {
    x = -(size * 2) + 'px';
    y = 'calc(-100% + ' + (-size - BUFFER) + 'px)';
  }

  if (direction === 'leftBottom') {
    x = (size + BUFFER) + 'px';
    y = 'calc(-100% + ' + (size * 2) + 'px)';
  }

  if (direction === 'leftCenter') {
    x = (size + BUFFER) + 'px';
    y = '-50%';
  }

  if (direction === 'leftTop') {
    x = (size + BUFFER) + 'px';
    y = -(size * 2) + 'px';
  }

  return `translate(${x}, ${y})`;
}

const STYLES = stylesheet({
  base: {
    ...BODY_TEXT_TYPE,
    display: 'inline-block',
    width: 340,
    backfaceVisibility: 'hidden',
  },
});

export type ArrowPosition = 'topLeft' | 'topCenter' | 'topRight' | 'rightTop' |
  'rightCenter' | 'rightBottom' | 'bottomRight' | 'bottomCenter' |
  'bottomLeft' | 'leftBottom' | 'leftCenter' | 'leftTop';

export interface IToolTipProps {
  arrowPosition?: ArrowPosition;
  backgroundColor: string;
  hasDropShadow?: boolean;
  isVisible: boolean;
  size: number;
  position?: {
    top: number,
    left: number,
  };
  zIndex?: number;
  onDeactivate?(): any;
  width?: number;
}

export interface IToolTipState {
  isVisible: boolean;
}

export class ToolTip extends React.PureComponent<IToolTipProps, IToolTipState> {
  container: HTMLDivElement = null;

  state = {
    isVisible: this.props.isVisible,
  };

  componentDidMount() {
    if (this.props.onDeactivate) {
      setTimeout(() => window.addEventListener('click', this.checkClick), 60);
    }
  }

  componentWillUpdate(nextProps: IToolTipProps) {
    if (this.props.isVisible !== nextProps.isVisible) {
      this.setState({
        isVisible: nextProps.isVisible,
      });
    }
  }

  componentWillUnmount() {
    window.removeEventListener('click', this.checkClick);
  }

  @autobind
  saveContainerRef(el: HTMLDivElement) {
    this.container = el;
  }

  @autobind
  checkClick(e: any) {
    e.preventDefault();
    if (!this.container || this.container.contains(e.target as any)) {
      return;
    }
    this.setState({
      isVisible: false,
    });
    if (this.props.onDeactivate) {
      this.props.onDeactivate();
    }
  }

  render() {
    const {
      arrowPosition,
      backgroundColor,
      hasDropShadow,
      children,
      position,
      size,
      zIndex,
      width,
    } = this.props;

    const {
      isVisible,
    } = this.state;

    return (
      <div
        ref={this.saveContainerRef}
        {...css(
          STYLES.base,
          { position: 'absolute', backgroundColor },
          width && { width },
          position && {
            left: position.left,
            top: position.top,
            transform: setTranslation(arrowPosition, size),
          },
          !isVisible && { display: 'none' },
          zIndex ? { zIndex } : { zIndex: TOOLTIP_Z_INDEX },
          hasDropShadow && { filter: 'drop-shadow(0px 0px 25px rgba(0, 0, 0, 0.117647))' },
        )}
      >
        {children}
        <div {...css(makeArrow(this.props.arrowPosition, this.props.backgroundColor, this.props.size))} />
      </div>
    );
  }
}
