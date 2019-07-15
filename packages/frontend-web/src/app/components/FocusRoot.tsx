/*
Copyright 2019 Google Inc.

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
import ReactDOM from 'react-dom';
import { connect, DispatchProp } from 'react-redux';
import { compose } from 'redux';
import { createStructuredSelector } from 'reselect';

import { FOCUS_DATA_ATTR } from '../config';
import { focusedElement, getCurrentlyFocused, reducer as focusRootReducer } from '../stores/focus';
import { css, stylesheet } from '../utilx';

export { focusRootReducer };

export const STYLES = stylesheet({
  base: { height: '100%' },
});

export interface IFocusRootProps extends DispatchProp<{}> {
  currentlyFocused: number;
}

class PureFocusRoot extends React.Component<IFocusRootProps> {
  render() {
    return (
      <div {...css(STYLES.base)}>
        {this.props.children}
      </div>
    );
  }

  componentDidMount () {
    const node = ReactDOM.findDOMNode(this) as HTMLElement;

    if (node) {
      node.addEventListener('focusin', this.onFocusIn as any);
    }
  }

  componentWillUnmount () {
    const node = ReactDOM.findDOMNode(this);
    node.removeEventListener('focusin', this.onFocusIn as any);
  }

  componentDidUpdate(prevProps: IFocusRootProps) {
    const node = ReactDOM.findDOMNode(this) as Element;

    if (this.props.currentlyFocused !== prevProps.currentlyFocused) {
      const focusId = this.props.currentlyFocused;
      const correctFocus =
        node.querySelector(`[${FOCUS_DATA_ATTR}="${focusId}"]`) as HTMLElement;

      if (correctFocus) {
        correctFocus.focus();
      }
    }
  }

  @autobind
  onFocusIn(e: React.FocusEvent<any>) {
    const activeElement = e.target as any;

    if (activeElement !== this.props.currentlyFocused) {
      const focusId = activeElement.getAttribute(FOCUS_DATA_ATTR);

      this.props.dispatch(focusedElement(focusId || null));
    }
  }
}

const mapStateToProps = createStructuredSelector({
  currentlyFocused: getCurrentlyFocused,
});

export const FocusRoot: React.ComponentClass = compose(
  connect<Pick<IFocusRootProps, 'currentlyFocused'>, Pick<IFocusRootProps, 'dispatch'>>(mapStateToProps),
)(PureFocusRoot);
