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
import ReactDOM from 'react-dom';

export const autoFocus = (
  focusTargetSelector: string,
  propsValidator:
  (props: any) => boolean,
) => (WrappedComponent: any): React.ComponentClass<any> => {
  return class extends React.Component<any> {
    render() {
      return (
        <WrappedComponent {...this.props} />
      );
    }

    componentDidUpdate(prevProps: any) {
      if (!propsValidator || this.props === prevProps) { return; }

      const prop = propsValidator(this.props);
      if (prop && (prop !== propsValidator(prevProps))) {
        this.attemptFocus();
      }
    }

    attemptFocus() {
      const node = ReactDOM.findDOMNode(this);
      const focusTarget =
        node.querySelector(`#${this.props.selector || focusTargetSelector}`) as HTMLElement;

      if (focusTarget) {
        focusTarget.focus();
      }
    }
  };
};
