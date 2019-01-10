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

import { List, Map } from 'immutable';
import React from 'react';
import { WithRouterProps } from 'react-router';
import { Link, NavigationTab, } from '../../../../../../components';
import {
  ApproveIcon,
  BatchIcon,
  DeferIcon,
  FlagIcon,
  HighlightIcon,
  RejectIcon,
  RoboIcon,
  ThumbUpIcon,
} from '../../../../../../components/Icons';
import {
  LIGHT_COLOR,
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
  WHITE_COLOR,
} from '../../../../../../styles';
import { css, stylesheet } from '../../../../../../utilx';

const ICON_SIZE = 30;

const STYLES = stylesheet({
  tabs: {
    background: MEDIUM_COLOR,
    display: 'flex',
    flexWrap: 'wrap',
    width: '100%',
    justifyContent: 'space-around',
  },

  tab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    flex: 1,
    minWidth: '128px',
    textDecoration: 'none',
    borderBottom: `2px solid transparent`,
    ':focus': {
      outline: 0,
      borderBottom: `2px solid ${WHITE_COLOR}`,
    },
  },
});

const navigationTabs = [
  {
    label: 'Approved',
    linkPath: 'approved',
    icon: ApproveIcon,
    count: 0,
  },
  {
    label: 'Rejected',
    linkPath: 'rejected',
    icon: RejectIcon,
    count: 0,
  },
  {
    label: 'Highlighted',
    linkPath: 'highlighted',
    icon: HighlightIcon,
    count: 0,
  },
  {
    label: 'Deferred',
    linkPath: 'deferred',
    icon: DeferIcon,
    count: 0,
  },
  {
    label: 'Flagged',
    linkPath: 'flagged',
    icon: FlagIcon,
    count: 51,
  },
  {
    label: 'Recommended',
    linkPath: 'recommended',
    icon: ThumbUpIcon,
    count: 0,
  },
  {
    label: 'Batched',
    linkPath: 'batched',
    icon: BatchIcon,
    count: 0,
  },
  {
    label: 'Automated',
    linkPath: 'automated',
    icon: RoboIcon,
    count: 0,
  },
];

export interface IModeratedStatusTabsProps extends WithRouterProps {
  moderatedComments: Map<string, List<number>>;
  urlPrefix: string;
}

export class ModeratedStatusTabs
    extends React.Component<IModeratedStatusTabsProps> {

  render () {
    const {
      router,
      urlPrefix,
      moderatedComments,
    } = this.props;

    return (
      <div {...css(STYLES.tabs)}>
        { navigationTabs.map((tab) => {
          const commentsForTag = moderatedComments && moderatedComments.get(tab.label.toLowerCase());

          const isRouteActive = router.isActive(`${urlPrefix}/${tab.linkPath}`);

          return (
            <Link
              key={tab.label}
              {...css(
                STYLES.tab,
                isRouteActive && { backgroundColor: LIGHT_COLOR },
              )}
              to={`${urlPrefix}/${tab.linkPath}`}
            >
              <NavigationTab
                label={tab.label}
                count={commentsForTag ? commentsForTag.size : 0}
                icon={(
                  <tab.icon
                    width={ICON_SIZE}
                    height={ICON_SIZE}
                    {...css({ fill: LIGHT_PRIMARY_TEXT_COLOR })}
                  />
                )}
              />
            </Link>
          );
        })}
      </div>
    );
  }
}
