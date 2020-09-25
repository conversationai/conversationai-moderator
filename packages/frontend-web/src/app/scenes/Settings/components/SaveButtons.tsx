/*
Copyright 2020 Google Inc.

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

import {Button, Fab, Tooltip} from '@material-ui/core';
import {Add} from '@material-ui/icons';

import {GUTTER_DEFAULT_SPACING} from '../../../styles';
import {css, stylesheet} from '../../../utilx';

export const STYLES: any = stylesheet({
  buttonGroup: {
    display: 'flex',
    flexDirection: 'row',
    paddingTop: `${GUTTER_DEFAULT_SPACING}px`,
    paddingBottom: `${GUTTER_DEFAULT_SPACING}px`,
  },
});

export function SaveButtons(props: {
  onCancelPress(): void,
  handleFormSubmit(): void,
  handleAdd(event: React.FormEvent<any>): void,
  addTip: string,
  width?: string,
}) {
  const {onCancelPress} = props;
  function handleFormSubmit(e: React.MouseEvent<any>) {
    e.preventDefault();
    props.handleFormSubmit();
  }

  const width = props.width || '100%';

  return (
    <div key="submitSection" {...css(STYLES.buttonGroup, {width: width})}>
      <div style={{flexGrow: 0, paddingRight: `${GUTTER_DEFAULT_SPACING}px`}}>
        <Button variant="outlined" onClick={onCancelPress} style={{width: '150px'}}>
          Cancel
        </Button>
      </div>
      <div style={{flexGrow: 0}}>
        <Button variant="contained" color="primary" onClick={handleFormSubmit} style={{width: '150px'}}>
          Save
        </Button>
      </div>
      <div style={{flexGrow: 1}}/>
      <div style={{flexGrow: 0}}>
        <Tooltip title={props.addTip}>
          <Fab color="primary" onClick={props.handleAdd}>
            <Add/>
          </Fab>
        </Tooltip>
      </div>
    </div>
  );
}
