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

import { Map, Set } from 'immutable';
import React from 'react';
import { Link } from 'react-router-dom';

import { OpenInNew, PersonAdd } from '@material-ui/icons/';

import { IArticleModel, ICategoryModel, IUserModel, ModelId } from '../../../models';
import { Avatar, MagicTimestamp, PseudoAvatar } from '../../components';
import { COMMON_STYLES, IMAGE_BASE } from '../../stylesx';
import { css, stylesheet } from '../../utilx';

interface IModeratorsWidgetProps {
  users: Map<string, IUserModel>;
  moderatorIds: Array<ModelId>;
  superModeratorIds: Array<ModelId>;
  openSetModerators(): void;
}

export const MODERATOR_WIDGET_STYLES = stylesheet({
  widget: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
});

export function ModeratorsWidget(props: IModeratorsWidgetProps) {
  const { users, moderatorIds, superModeratorIds }  = props;

  let s = Set(moderatorIds);
  if (superModeratorIds) {
    s = s.merge(superModeratorIds);
  }

  const moderators = s.toArray().map((uid: string) => users.get(uid));

  if (moderators.length === 0) {
    return (
      <div onClick={props.openSetModerators} {...css(MODERATOR_WIDGET_STYLES.widget)}>
        <PseudoAvatar size={IMAGE_BASE}>
          <PersonAdd/>
        </PseudoAvatar>
      </div>
    );
  }

  if (moderators.length === 1) {
    const u = moderators[0];
    return (
      <div onClick={props.openSetModerators} {...css(MODERATOR_WIDGET_STYLES.widget)}>
        <Avatar target={u} size={IMAGE_BASE}/>
      </div>
    );
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
    ret.push(<Avatar target={moderators[i]} size={IMAGE_BASE / 2}/>);
  }
  if (extra) {
    ret.push(<PseudoAvatar size={IMAGE_BASE / 2}>+{moderators.length - 3}</PseudoAvatar>);
  }

  return (
    <div onClick={props.openSetModerators} {...css(MODERATOR_WIDGET_STYLES.widget)}>
      {ret}
    </div>
  );
}

export const TITLE_CELL_STYLES = stylesheet({
  superText: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'rgba(0,0,0,0.54)',
  },
  categoryLabel: {
    textTransform: 'uppercase',
    marginRight: '12px',
  },
  mainText: {
    display: 'flex',
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

export function TitleCell(props: ITitleCellProps) {
  const {
    category,
    article,
    link,
  } = props;

  const supertext = [];
  if (category) {
    supertext.push(<span key="label" {...css(TITLE_CELL_STYLES.categoryLabel)}>{category.label}</span>);
  }
  if (article.sourceCreatedAt) {
    supertext.push((
      <span key="timestamp">
        <MagicTimestamp timestamp={article.sourceCreatedAt} inFuture={false}/>
      </span>
    ));
  }

  return (
    <>
      {supertext.length > 0 && <div {...css(TITLE_CELL_STYLES.superText)}>{supertext}</div>}
      <div {...css(TITLE_CELL_STYLES.mainText)}>
        <div>
          <Link to={link} {...css(COMMON_STYLES.cellLink, TITLE_CELL_STYLES.mainTextText)}>
            {article.title}
          </Link>
        </div>
        {article.url && (
        <div {...css(TITLE_CELL_STYLES.mainTextLink)}>
          <a key="link" href={article.url} target="_blank" {...css(COMMON_STYLES.cellLink)}>
            <OpenInNew fontSize="small" />
          </a>
        </div>
        )}
      </div>
    </>
  );
}
