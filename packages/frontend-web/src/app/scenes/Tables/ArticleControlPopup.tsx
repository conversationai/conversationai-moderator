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

import {
  ClickAwayListener,
  DialogTitle,
  Switch,
} from '@material-ui/core';

import { IArticleModel } from '../../../models';
import { NICE_CONTROL_BLUE, SCRIM_STYLE } from '../../styles';
import { css } from '../../utilx';
import { ControlFlag } from './components';

export interface IIControlPopupProps {
  article: IArticleModel;
  clearPopups(): void;
  saveControls(isCommentingEnabled: boolean, isAutoModerated: boolean): void;
}

export interface IIControlPopupState {
  isCommentingEnabled: boolean;
  isAutoModerated: boolean;
}

export class ArticleControlPopup extends React.Component<IIControlPopupProps, IIControlPopupState> {
  constructor(props: Readonly<IIControlPopupProps>) {
    super(props);
    this.state = {
      isCommentingEnabled: this.props.article.isCommentingEnabled,
      isAutoModerated: this.props.article.isAutoModerated,
    };
  }

  @autobind
  handleCommentingEnabledClicked() {
    this.setState({isCommentingEnabled: !this.state.isCommentingEnabled});
  }

  @autobind
  handleAutoModeratedClicked() {
    if (!this.state.isCommentingEnabled) {
      return;
    }
    this.setState({isAutoModerated: !this.state.isAutoModerated});
  }

  @autobind
  saveControls() {
    this.props.saveControls(this.state.isCommentingEnabled, this.state.isAutoModerated);
  }

  render() {
    return (
      <ClickAwayListener onClickAway={this.props.clearPopups}>
        <div tabIndex={0} {...css(SCRIM_STYLE.popupMenu, {padding: '20px'})}>
          <DialogTitle id="article-controls">Moderation settings</DialogTitle>
          <table key="main" {...css({width: 'compute(100% - 50px)', margin: '4px 9px 4px 25px'})}>
            <tbody>
            <tr key="comments" onClick={this.handleCommentingEnabledClicked}>
              <td key="icon">
                <ControlFlag isCommentingEnabled={this.state.isCommentingEnabled}/>
              </td>
              <td key="text" {...css({textAlign: 'left', padding: '15px 4px'})}>
                <label {...css(SCRIM_STYLE.popupContent)}>
                  Comments Enabled
                </label>
              </td>
              <td key="toggle" {...css({textAlign: 'right'})}>
                <Switch checked={this.state.isCommentingEnabled} color="primary"/>
              </td>
            </tr>
            <tr key="automod" onClick={this.handleAutoModeratedClicked} {...css(this.state.isCommentingEnabled ? {} : {opacity: 0.5})}>
              <td key="icon">
                <ControlFlag isCommentingEnabled={this.state.isCommentingEnabled} isAutoModerated={this.state.isAutoModerated}/>
              </td>
              <td key="text"  {...css({textAlign: 'left', padding: '15px 4px'})}>
                <label {...css(SCRIM_STYLE.popupContent)}>
                  Auto Moderation Enabled
                </label>
              </td>
              <td key="toggle" {...css({textAlign: 'right'})}>
                <Switch checked={this.state.isAutoModerated} disabled={!this.state.isCommentingEnabled} color="primary"/>
              </td>
            </tr>
            </tbody>
          </table>
          <div key="footer" {...css({textAlign: 'right', margin: '35px 25px 30px 25px'})}>
            <span onClick={this.props.clearPopups} {...css({marginRight: '30px', opacity: '0.5'})}>Cancel</span>
            <span onClick={this.saveControls} {...css({color: NICE_CONTROL_BLUE})}>Save</span>
          </div>
        </div>
      </ClickAwayListener>
    );
  }
}
