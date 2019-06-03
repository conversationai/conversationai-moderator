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
import { Map, Set } from 'immutable';
import React from 'react';
import { Link } from 'react-router';

import { OpenInNew } from '@material-ui/icons/';

import { IArticleModel, ICategoryModel, IUserModel, ModelId } from '../../../models';
import * as icons from '../../components/Icons';
import { NICE_MIDDLE_BLUE } from '../../styles';
import { COMMON_STYLES, ICON_STYLES } from '../../stylesx';
import { css, stylesheet } from '../../utilx';

export interface IMagicTimestampProps {
  timestamp: string;
  inFuture?: boolean;
}

function maybeS(val: number) {
  return val > 1 ? 's' : '';
}

export class MagicTimestamp extends React.Component<IMagicTimestampProps> {
  timeoutId?: ReturnType<typeof setTimeout>;

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

    if (diff < 0 || diff > 60 * 60 * 24 * 7) {
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
      text = `a few seconds`;
      redrawIn = 60 - diff;
    }
    else if (diff < 60 * 60) {
      const mins = Math.floor(diff / 60);
      if (this.props.inFuture) {
        redrawIn = diff - mins * 60 + 1;
      }
      else {
        redrawIn = (mins + 1) * 60 - diff + 1;
      }
      text = `${mins} minute${maybeS(mins)}`;
    }
    else if (diff < 60 * 60 * 24) {
      const hours = Math.floor(diff / 60 / 60);
      if (this.props.inFuture) {
        redrawIn = diff - hours * 60 * 60 + 1;
      }
      else {
        redrawIn = (hours + 1) * 60 * 60 - diff + 1;
      }
      text = `${hours} hour${maybeS(hours)}`;
    }
    else if (diff < 60 * 60 * 24 * 7) {
      const days = Math.floor(diff / 60 / 60 / 24);
      if (this.props.inFuture) {
        redrawIn = diff - days * 60 * 60 + 1;
      }
      else {
        redrawIn = (days + 1) * 60 * 60 - diff + 1;
      }
      text = `${days} day${maybeS(days)}`;
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
      return (<img alt={user.name} key={user.id} src={user.avatarURL} {...css(ICON_STYLES.xsmallImage, {margin: '1px'})}/>);
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

interface IModeratorsWidgetProps {
  users: Map<string, IUserModel>;
  moderatorIds: Array<ModelId>;
  superModeratorIds: Array<ModelId>;
  openSetModerators(): void;
}

export class ModeratorsWidget extends React.Component<IModeratorsWidgetProps> {
  @autobind
  openModeratorsDlg() {
    this.props.openSetModerators();
  }

  render() {
    const { users, moderatorIds, superModeratorIds }  = this.props;

    let s = Set(moderatorIds);
    if (superModeratorIds) {
      s = s.merge(superModeratorIds);
    }

    const moderators = s.toArray().map((uid: string) => users.get(uid));

    if (moderators.length === 0) {
      return (
        <div onClick={this.openModeratorsDlg} {...css(ICON_STYLES.iconBackgroundCircle)}>
          <div {...css(ICON_STYLES.iconCenter)} >
            <icons.UserPlusIcon
              {...css(ICON_STYLES.smallIcon, {width: `${30}px`, height: `${30}px`})}
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
            {...css(ICON_STYLES.smallImage)}
          />
        );
      } else {
        return (
          <div onClick={this.openModeratorsDlg} {...css(ICON_STYLES.iconBackgroundCircle)}>
            <div {...css(ICON_STYLES.iconCenter)} >
              <icons.UserIcon {...css(ICON_STYLES.smallIcon, {color: NICE_MIDDLE_BLUE})}/>
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
          <div {...css(ICON_STYLES.textCenterSmall)}>+{moderators.length - 3}</div>
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

export const TITLE_CELL_STYLES = stylesheet({
  titleCell: {
    paddingLeft: '10px',
    paddingRight: '20px',
  },
  superText: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'rgba(0,0,0,0.54)',
    margin: '10px 0',
  },
  categoryLabel: {
    textTransform: 'uppercase',
    marginRight: '12px',
  },
  mainText: {
    display: 'flex',
    margin: '10px 0',
  },
  mainTextText: {
    lineHeight: '20px',
  },
  mainTextLink: {
    padding: '0 10px',
    color: 'rgba(0,0,0,0.54)',
  },
});

interface ITitleCellProps {
  category?: ICategoryModel;
  article: IArticleModel;
  link: string;
}

export class TitleCell extends React.Component<ITitleCellProps> {
  render() {
    const {
      category,
      article,
      link,
    } = this.props;

    const supertext = [];
    if (category) {
      supertext.push(<span key="label" {...css(TITLE_CELL_STYLES.categoryLabel)}>{category.label}</span>);
    }
    if (article.sourceCreatedAt) {
      supertext.push(
        <span key="timestamp">
          <MagicTimestamp timestamp={article.sourceCreatedAt} inFuture={false}/>
        </span>,
      );
    }

    return (
      <div {...css(TITLE_CELL_STYLES.titleCell)}>
        {supertext.length > 0 && <div {...css(TITLE_CELL_STYLES.superText)}>{supertext}</div>}
        <div {...css(TITLE_CELL_STYLES.mainText)}>
          <div>
            <Link to={link} {...css(COMMON_STYLES.cellLink, TITLE_CELL_STYLES.mainTextText)}>
              {article.title}
            </Link>
          </div>
          {article.url &&
          <div {...css(TITLE_CELL_STYLES.mainTextLink)}>
            <a key="link" href={article.url} target="_blank" {...css(COMMON_STYLES.cellLink)}>
              <OpenInNew fontSize="small" />
            </a>
          </div>
          }
        </div>
      </div>
    );
  }
}

export class SimpleTitleCell extends React.Component<ITitleCellProps> {
  render() {
    const {
      article,
      link,
    } = this.props;

    return (
      <div {...css(TITLE_CELL_STYLES.titleCell)}>
        <div {...css(TITLE_CELL_STYLES.mainText)}>
          <div>
            <Link to={link} {...css(COMMON_STYLES.cellLink, TITLE_CELL_STYLES.mainTextText)}>
              {article.title}
            </Link>
          </div>
        </div>
      </div>
    );
  }
}
