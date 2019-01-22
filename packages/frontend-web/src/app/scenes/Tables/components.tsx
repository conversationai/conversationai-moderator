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
import { Set } from 'immutable';
import React from 'react';
import Timer = NodeJS.Timer;

import { IArticleModel, IUserModel } from '../../../models';
import * as icons from '../../components/Icons';
import { GREY_COLOR, NICE_CONTROL_BLUE, NICE_MIDDLE_BLUE } from '../../styles';
import { css } from '../../utilx';
import { COMMON_STYLES, ICON_STYLES } from './styles';

export interface IMagicTimestampProps {
  timestamp: string;
  inFuture: boolean;
}

export class MagicTimestamp extends React.Component<IMagicTimestampProps> {
  timeoutId?: Timer;

  render() {
    const then = new Date(this.props.timestamp);
    const now = Date.now();

    let diff = Math.round((now - then.getTime()) / 1000);

    if (this.props.inFuture) {
      diff = -diff;
    }

    let text;
    let redrawIn = 0;
    let isRelative = true;

    if (diff < 0 || diff > 60 * 60 * 24) {
      // Just use the date
      const monthNames = [
        'Jan', 'Feb', 'March',
        'April', 'May', 'June', 'July',
        'Aug', 'Sept', 'Oct',
        'Nov', 'Dec',
      ];

      const day = then.getDate();
      const monthIndex = then.getMonth();
      const year = then.getFullYear();

      text = `${monthNames[monthIndex]} ${day}`;
      if (year !== (new Date(now)).getFullYear()) {
        text += `, ${year}`;
      }
      isRelative = false;
    }
    else if (diff < 60) {
      text = `${diff} s`;
      redrawIn = 1;
    }
    else if (diff < 60 * 60) {
      const mins = Math.floor(diff / 60);
      if (this.props.inFuture) {
        redrawIn = diff - mins * 60 + 1;
      }
      else {
        redrawIn = (mins + 1) * 60 - diff + 1;
      }
      text = `${mins} m`;
    }
    else if (diff < 60 * 60 * 24) {
      const hours = Math.floor(diff / 60 / 60);
      if (this.props.inFuture) {
        redrawIn = diff - hours * 60 * 60 + 1;
      }
      else {
        redrawIn = (hours + 1) * 60 * 60 - diff + 1;
      }
      text = `${hours} h`;
    }
    else if (diff < 60 * 60 * 24 * 7) {
      const days = Math.floor(diff / 60 / 60 / 24);
      if (this.props.inFuture) {
        redrawIn = diff - days * 60 * 60 + 1;
      }
      else {
        redrawIn = (days + 1) * 60 * 60 - diff + 1;
      }
      text = `${days} days`;
    }

    if (redrawIn > 0 && !this.timeoutId) {
      this.timeoutId = setTimeout(this.doUpdate, redrawIn * 1000);
    }

    if (isRelative) {
      if (this.props.inFuture) {
        text = `in ` + text;
      }
      else {
        text += ` ago`;
      }
    }

    return (<span>{text}</span>);
  }

  @autobind
  doUpdate() {
    this.timeoutId = undefined;
    this.forceUpdate();
  }

  componentWillUnmount() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = undefined;
    }
  }
}

interface ISmallUserIconProps {
  user: IUserModel;
}

export class SmallUserIcon extends React.Component<ISmallUserIconProps> {
  render() {
    const user = this.props.user;
    if (user.avatarURL) {
      return (<img alt={user.name} key={user.id} src={user.avatarURL} {...css(COMMON_STYLES.xsmallImage, {margin: '1px'})}/>);
    }
    else {
      return (
        <div key={user.id} {...css(ICON_STYLES.small, {display: 'inline-block', margin: '1px'})}>
          <div {...css(ICON_STYLES.iconBackgroundCircleSmall)}>
            <div {...css(ICON_STYLES.iconCenter)}>
              <icons.UserIcon {...css(ICON_STYLES.small, {color: NICE_MIDDLE_BLUE})}/>
            </div>
          </div>
        </div>
      );
    }
  }
}

interface IIControlFlagProps {
  isCommentingEnabled?: boolean;
  isAutoModerated?: boolean;
}

export class ControlFlag extends React.Component<IIControlFlagProps> {
  render() {
    let style: any;
    let Icon: any;

    if (this.props.isAutoModerated) {
      Icon = icons.SpeechBubbleIconCircle;
    }
    else {
      Icon = icons.SpeechBubbleIcon;
    }

    if (this.props.isCommentingEnabled) {
      style = {color: NICE_CONTROL_BLUE};
    }
    else {
      style = {color: GREY_COLOR};
    }
    return (<Icon {...css(style)}/>);
  }
}

interface IIModeratorsWidgetProps {
  users: Map<string, IUserModel>;
  article: IArticleModel;
  openSetModerators(article: IArticleModel): void;
}

export class ModeratorsWidget extends React.Component<IIModeratorsWidgetProps> {
  @autobind
  openModeratorsDlg() {
    this.props.openSetModerators(this.props.article);
  }

  render() {
    const { article, users }  = this.props;

    let s = Set(article.assignedModerators);
    if (article.category) {
      s = s.merge(article.category.assignedModerators);
    }

    const moderators = s.toArray().map((uid: string) => users.get(uid));

    if (moderators.length === 0) {
      return (
        <div onClick={this.openModeratorsDlg} {...css(ICON_STYLES.iconBackgroundCircle)}>
          <div {...css(ICON_STYLES.iconCenter)} >
            <icons.UserPlusIcon
              {...css(COMMON_STYLES.smallIcon, {width: `${30}px`, height: `${30}px`})}
              onClick={this.openModeratorsDlg}
            />
          </div>
        </div>
      );
    }

    if (moderators.length === 1) {
      const u = moderators[0];
      if (u.avatarURL) {
        return (
          <img
            alt={u.name}
            src={u.avatarURL}
            onClick={this.openModeratorsDlg}
            {...css(COMMON_STYLES.smallImage)}
          />
        );
      } else {
        return (
          <div onClick={this.openModeratorsDlg} {...css(ICON_STYLES.iconBackgroundCircle)}>
            <div {...css(ICON_STYLES.iconCenter)} >
              <icons.UserIcon {...css(COMMON_STYLES.smallIcon, {color: NICE_MIDDLE_BLUE})}/>
            </div>
          </div>
        );
      }
    }

    const ret = [];
    let limit = moderators.length;
    let extra = false;
    if (limit > 4) {
      limit = 3;
      extra = true;
    } else if (limit === 4) {
      limit = 4;
    }

    for (let i = 0; i < limit; i++) {
      ret.push(<SmallUserIcon user={moderators[i]}/>);
    }
    if (extra) {
      ret.push(
        <div key="extra" style={{display: 'inline-block', margin: '1px'}}>
          <div {...css(COMMON_STYLES.textCenterSmall)}>+{moderators.length - 3}</div>
        </div>,
      );
    }

    return (
      <div onClick={this.openModeratorsDlg} {...css({display: 'flex', flexWrap: 'wrap', justifyContent: 'center'})}>
        {ret}
      </div>
    );
  }
}
