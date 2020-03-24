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
import {Link} from 'react-router-dom';

import {IAuthorAttributes} from '../../../../models';
import {searchLink} from '../../../scenes/routes';
import {BOX_DEFAULT_SPACING, CAPTION_TYPE, DARK_SECONDARY_TEXT_COLOR} from '../../../styles';
import {css, stylesheet} from '../../../utilx';
import {EmailIcon, FaceIcon, IdIcon, ReputationIcon} from '../../Icons';

const DETAIL_STYLES = stylesheet({
  row: {
    display: 'flex',
    flexWrap: 'no-wrap',
    alignItems: 'center',
    marginRight: `${BOX_DEFAULT_SPACING}px`,
    overflow: 'hidden',
  },

  icon: {
    display: 'flex',
    marginRight: '5px',
  },

  label: {
    ...CAPTION_TYPE,
    color: DARK_SECONDARY_TEXT_COLOR,
    maxWidth: 120,
    overflow: 'hidden',
    whiteSpace: 'no-wrap',
    textOverflow: 'ellipsis',
  },

  linkFocus: {
    ':focus': {
      outline: 0,
      textDecoration: 'underline',
    },
  },
});

const DETAIL_LINK = {
  color: DARK_SECONDARY_TEXT_COLOR,
  textDecoration: 'none',
  ':focus': {
    outline: 0,
    textDecoration: 'underline',
  },
};

export const ICON_SIZE = 20;

export interface IDetailRowProps {
  label: string | JSX.Element;
  value?: string;
  icon?: JSX.Element;
}

export const DetailRow = ({ label, value, icon }: IDetailRowProps) => (
  <div {...css(DETAIL_STYLES.row)}>
    <div {...css(DETAIL_STYLES.icon)}>{value || icon}</div>
    <div {...css(DETAIL_STYLES.label)}>{label}</div>
  </div>
);

export function EmailRow({author}: {author: IAuthorAttributes}) {
  return (
    <DetailRow
      key="email"
      label={(
        <a {...css(DETAIL_LINK)} href={'mailto:' + author.email}>
          {author.email}
        </a>
      )}
      icon={(
        <EmailIcon
          {...css({ fill: DARK_SECONDARY_TEXT_COLOR })}
          size={ICON_SIZE}
        />
      )}
    />

  );
}

export function SourceIdRow({authorSourceId}: {authorSourceId: string}) {
  return (
    <Link
      key="authorSourceId"
      to={searchLink({searchByAuthor: true, term: authorSourceId.toString()})}
      {...css(DETAIL_STYLES.linkFocus)}
    >
      <DetailRow
        label={authorSourceId.toString()}
        icon={(
          <IdIcon
            {...css({ fill: DARK_SECONDARY_TEXT_COLOR })}
            size={ICON_SIZE}
          />
        )}
      />
    </Link>
  );
}

export function ApprovalRatingRow({approvalRating}: {approvalRating: string}) {
  return (
    <DetailRow
      key="author"
      icon={(
        <ReputationIcon
          {...css({ fill: DARK_SECONDARY_TEXT_COLOR })}
          size={ICON_SIZE}
        />
      )}
      label={approvalRating}
    />
  );
}

export function IsSubscriberRow() {
  return (
    <DetailRow
      key="subscriber"
      label="Subscriber"
      icon={(
        <FaceIcon
          {...css({ fill: DARK_SECONDARY_TEXT_COLOR })}
          size={ICON_SIZE}
        />
      )}
    />
  );
}
