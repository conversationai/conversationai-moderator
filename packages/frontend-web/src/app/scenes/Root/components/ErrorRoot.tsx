
import React from 'react';

import { css } from '../../../utilx';
import { SplashRoot } from './SplashRoot';
import { ROOT_STYLES } from './styles';

interface IErrorRootProps {
  errorMessage: string;
}

export class ErrorRoot extends React.Component<IErrorRootProps> {
  render() {
    return (
      <SplashRoot>
        <div key="login-errors" {...css(ROOT_STYLES.errors, ROOT_STYLES.fadeIn)}>
          <p key="message">{this.props.errorMessage}</p>
        </div>
      </SplashRoot>
    );
  }
}
