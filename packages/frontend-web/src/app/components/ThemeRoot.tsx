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

import React from 'react';

import {
  createMuiTheme,
  CssBaseline,
} from '@material-ui/core';
import {
  ThemeProvider,
} from '@material-ui/styles';

import { NICE_MIDDLE_BLUE } from '../styles';

const theme = createMuiTheme({
  typography: {
    fontFamily: 'Libre Franklin',
  },
  palette: {
    background: {
      default: NICE_MIDDLE_BLUE,
    },
  },
});

export class ThemeRoot extends React.Component {
  render() {
    return (
      <ThemeProvider key="root" theme={theme}>
        <CssBaseline key="baseline"/>
        {this.props.children}
      </ThemeProvider>
    );
  }
}
