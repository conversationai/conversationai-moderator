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
import distanceInWordsToNow from 'date-fns/distance_in_words_to_now';
import { List, Set } from 'immutable';
import React from 'react';
const Linkify = require('react-linkify').default;

import { OpenInNew } from '@material-ui/icons';

import { ICommentModel, ModelId } from '../../../models';
import {
  IConfirmationAction,
  IModerationAction,
  ITopScore,
} from '../../../types';
import { FlagsSummary } from '../../scenes/Comments/components/FlagsSummary';
import {
  articleBase,
  commentRepliesDetailsLink,
  NEW_COMMENTS_DEFAULT_TAG,
  newCommentsPageLink,
  searchLink,
} from '../../scenes/routes';
import {
  ARTICLE_HEADLINE_TYPE,
  BODY_TEXT_BOLD_TYPE,
  DARK_COLOR,
  MEDIUM_COLOR,
} from '../../styles';
import { COMMON_STYLES } from '../../stylesx';
import { maybeCallback, partial } from '../../util';
import { css } from '../../utilx';
import { Avatar } from '../Avatar';
import {
  ConfirmationCircle,
} from '../ConfirmationCircle';
import {
  MoreVerticalIcon,
  ReplyIcon,
} from '../Icons';
import {
  ROW_STYLES,
} from '../LazyCommentList';
import { Link } from '../Link';
import { ModerateButtons } from '../ModerateButtons';

const LAZY_BOX_STYLE = {
  width: '100%',
  height: '100%',
};

const AVATAR_SIZE = 24;

export type ILinkTargetGetter = (comment: ICommentModel) => string;

export interface IBasicBodyProps {
  comment: ICommentModel;
  hideCommentAction?: boolean;
  topScore?: ITopScore;
  showActions?: boolean;
  dispatchConfirmedAction?(action: IConfirmationAction, ids: Array<string>, shouldTriggerToast?: boolean): any;
  commentLinkTarget?: string;
  onCommentClick?(commentId: string): any;
  searchTerm?: string;
  displayArticleTitle?: boolean;
  requireReasonForReject?: boolean;
  handleAssignTagsSubmit(commentId: ModelId, selectedTagIds: Set<ModelId>, rejectedTagIds: Set<ModelId>): Promise<void>;
}

export interface IBasicBodyState {
  hover: boolean;
  popupOpen: boolean;
}

export class BasicBody extends React.PureComponent<IBasicBodyProps, IBasicBodyState> {
  state = {
    hover: false,
    popupOpen: false,
  };

  @autobind
  popupOpen(isOpen: boolean) {
    this.setState({popupOpen: isOpen});
  }

  @autobind
  mouseEnter() {
    this.setState({hover: true});
  }

  @autobind
  mouseLeave() {
    this.setState({hover: false});
  }

  @autobind
  onModerateButtonClick(comment: ICommentModel, action: IConfirmationAction, shouldTriggerToast: boolean): void {
    this.props.dispatchConfirmedAction(action, [comment.id], shouldTriggerToast);
  }

  getActiveButtons(): List<IModerationAction> {
    const { comment } = this.props;
    const activeCommentStates = [];

    if (comment.isAccepted === true) { activeCommentStates.push('approve'); }
    if (comment.isAccepted === false || this.state.popupOpen) { activeCommentStates.push('reject'); }
    if (comment.isHighlighted) { activeCommentStates.push('highlight'); }
    if (comment.isDeferred) { activeCommentStates.push('defer'); }

    return List<IModerationAction>(activeCommentStates);
  }

  isModerated() {
    const { comment } = this.props;

    return comment.isAccepted === true || comment.isAccepted === false;
  }

  @autobind
  onClickModerateActions(action: IConfirmationAction): void {

    const activeCommentStates = this.getActiveButtons();

    const shouldReset = this.isModerated() && activeCommentStates.includes(action as IModerationAction);

    // Highlight action already contains special reset function
    const newAction = shouldReset
      ? action === 'highlight' ? 'highlight' : 'reset'
      : action;

    this.onModerateButtonClick(
      this.props.comment,
      newAction,
      false,
    );
  }

  render() {
    const {
      comment,
      hideCommentAction,
      topScore,
      commentLinkTarget,
      onCommentClick,
      displayArticleTitle,
      requireReasonForReject,
      handleAssignTagsSubmit,
    } = this.props;

    const actionsAreVisible = this.state.hover || this.state.popupOpen;
    const activeButtons = this.getActiveButtons();

    let currentIndex = 0;
    let output = [];

    if (topScore) {
      const startIndex =
          topScore.start < currentIndex ? currentIndex : topScore.start;

      function addRange(
        originalString: string,
        start: number,
        end: number,
        isTag?: boolean,
      ) {
        currentIndex = end;
        const str = originalString.slice(start, end);
        if (str.length > 0) {
          if (isTag) {
            return (
              <span
                key={currentIndex}
                data-status={status}
                {...css(BODY_TEXT_BOLD_TYPE)}
              >
                {str}
              </span>
            );
          } else {
            return <span>{str}</span>;
          }
        }

        return null;
      }
      output.push(addRange(comment.text, currentIndex, startIndex));
      output.push(addRange(comment.text, currentIndex, topScore.end, true));
      output.push(addRange(comment.text, currentIndex, comment.text.length));
    } else {
      output = [<span key={comment.id}>{comment.text}</span>];
    }

    return(
      <div
        onMouseEnter={this.mouseEnter}
        onMouseLeave={this.mouseLeave}
        {...css(ROW_STYLES.comment, {flex: 1})}
      >
        {displayArticleTitle && (
          <div key="title">
            <Link
              key="text"
              {...css(ROW_STYLES.articleLink)}
              to={newCommentsPageLink({
                context: articleBase,
                contextId: comment.article.id,
                tag: NEW_COMMENTS_DEFAULT_TAG,
              })}
            >
              <h4 {...css(ARTICLE_HEADLINE_TYPE, { marginBottom: '0px', marginTop: '0px'  })}>
                {comment.article.title}
              </h4>
            </Link>
            {comment.article.url && (
            <div key="link" style={{display: 'inline-block', margin: '0 10px', position: 'relative', top: '3px'}}>
              <a href={comment.article.url} target="_blank" {...css(COMMON_STYLES.cellLink)}>
                <OpenInNew fontSize="small"/>
              </a>
            </div>
          )}
          </div>
        )}
        <div key="body" {...css(ROW_STYLES.meta)}>
          <div key="text" {...css(ROW_STYLES.authorRow)}>
            { comment.replyToSourceId > 0 && (
              <Link
                to={commentRepliesDetailsLink({
                  context: articleBase,
                  contextId: comment.articleId,
                  commentId: comment.replyId,
                  originatingCommentId: comment.id,
                })}
                {...css(ROW_STYLES.reply)}
                onClick={partial(maybeCallback(onCommentClick), comment.id)}
              >
                <ReplyIcon {...css({fill: DARK_COLOR})} size={24} />
              </Link>
              )}

            { comment.author.avatar && (
              <span {...css({marginRight: '8px'})}>
                <Avatar size={AVATAR_SIZE} target={comment.author} />
              </span>
            )}
            { comment.author.name && (
              <Link to={searchLink({searchByAuthor: true, term: comment.author.name})} {...css({ color: DARK_COLOR })}>{comment.author.name}&nbsp;</Link>
            )}
            {comment.author.location && (
              <span>from {comment.author.location}&nbsp;</span>
            )}
            <span {...css({textDecoration: 'none'})}> &bull; {distanceInWordsToNow(new Date(comment.sourceCreatedAt))} ago&nbsp;</span>
            <FlagsSummary comment={comment}/>
            {actionsAreVisible && (
              <Link
                {...css(ROW_STYLES.detailsButton)}
                to={commentLinkTarget}
                onClick={partial(maybeCallback(onCommentClick), comment.id)}
              >
                View Details
              </Link>
            )}
          </div>

          { !hideCommentAction && actionsAreVisible ? (
            <div
              key="actions"
              {...css({ marginRight: '10px' })}
            >
              <ModerateButtons
                activeButtons={activeButtons}
                darkOnLight
                hideLabel
                containerSize={36}
                onClick={this.onClickModerateActions}
                requireReasonForReject={requireReasonForReject}
                comment={comment}
                handleAssignTagsSubmit={handleAssignTagsSubmit}
                popupOpen={this.popupOpen}
              />
            </div>
            ) : (
              <div key="actions2" {...css(ROW_STYLES.actionContainer)}>
                { activeButtons && activeButtons.includes('approve') && (
                  <div key="approve" {...css({ marginRight: '10px' })}>
                    <ConfirmationCircle
                      backgroundColor={MEDIUM_COLOR}
                      action="approve"
                      size={36}
                      iconSize={20}
                    />
                  </div>
                )
              }
              { activeButtons && activeButtons.includes('highlight') && (
                <div key="highlight" {...css({ marginRight: '10px' })}>
                  <ConfirmationCircle
                    backgroundColor={MEDIUM_COLOR}
                    action="highlight"
                    size={36}
                    iconSize={20}
                  />
                </div>
              )}
              { activeButtons && activeButtons.includes('reject') && (
                <div key="reject" {...css({ marginRight: '10px' })}>
                  <ConfirmationCircle
                    backgroundColor={MEDIUM_COLOR}
                    action="reject"
                    size={36}
                    iconSize={20}
                  />
                </div>
              )}
              { activeButtons && activeButtons.includes('defer') && (
                <div key="defer" {...css({ marginRight: '10px' })}>
                  <ConfirmationCircle
                    backgroundColor={MEDIUM_COLOR}
                    action="defer"
                    size={36}
                    iconSize={20}
                  />
                </div>
              )}
              { !hideCommentAction && (
                <button key="moreactons" {...css(ROW_STYLES.actionToggle)} type="button">
                  <MoreVerticalIcon size={20} />
                </button>
              )}
            </div>
          )}
        </div>
        <div key="text" {...css(ROW_STYLES.commentContainer)}>
          <Linkify properties={{target: '_blank'}}>
            <div {...css(ROW_STYLES.comment)}>
              { commentLinkTarget ? (
                <div {...css({ display: 'flex', flexDirection: 'column' })}>
                  <p>
                    {output}
                  </p>
                </div>
              ) :
                output
              }
            </div>
          </Linkify>
        </div>
      </div>
    );
  }
}

export interface ILinkedBasicBodyProps extends IBasicBodyProps {
  getLinkTarget: ILinkTargetGetter;
}

export class LinkedBasicBody extends React.PureComponent<ILinkedBasicBodyProps> {

  render() {
    const {
      comment,
      getLinkTarget,
      onCommentClick,
      hideCommentAction,
      topScore,
      showActions,
      dispatchConfirmedAction,
      searchTerm,
      displayArticleTitle,
      requireReasonForReject,
      handleAssignTagsSubmit,
    } = this.props;

    return (
      <div key={`${comment.id}`}>
        <BasicBody
          searchTerm={searchTerm}
          commentLinkTarget={getLinkTarget(comment)}
          onCommentClick={onCommentClick}
          topScore={topScore}
          comment={comment}
          hideCommentAction={hideCommentAction}
          showActions={showActions}
          dispatchConfirmedAction={dispatchConfirmedAction}
          displayArticleTitle={displayArticleTitle}
          requireReasonForReject={requireReasonForReject}
          handleAssignTagsSubmit={handleAssignTagsSubmit}
        />
      </div>
    );
  }
}

export interface ICommentProps {
  comment: ICommentModel;
  sortContent: Array<string>;
  topScore?: ITopScore;
}

export type ICommentPropsForRow = (index: number) => ICommentProps | null;

export interface ILazyLoadCommentProps extends React.HTMLProps<any> {
  loadingPlaceholder?: JSX.Element | string;
  rowIndex: number;
  onRowRender(index: number): Promise<ICommentModel>;
  commentPropsForRow: ICommentPropsForRow;
  updateCounter?: number;
  dispatchConfirmedAction?(action: IConfirmationAction, ids: Array<string>, shouldTriggerToast?: boolean): any;
  requireReasonForReject?: boolean;
}

export interface ILazyLoadCommentState {
  hasLoaded?: boolean;
  currentIndex?: number;
}

export class LazyLoadComment
    extends React.PureComponent<ILazyLoadCommentProps, ILazyLoadCommentState> {
  state: ILazyLoadCommentState = {
    hasLoaded: false,
    currentIndex: null,
  };

  render() {
    const {
      commentPropsForRow,
      rowIndex,
      children,
      loadingPlaceholder,
      dispatchConfirmedAction,
      requireReasonForReject,
    } = this.props;

    const props = commentPropsForRow(rowIndex);

    if (props && this.state.hasLoaded) {
      return (
        <div {...css(LAZY_BOX_STYLE)}>
          {React.Children.map(
            children,
            (child: any) => (
              React.cloneElement(child, {
                ...child.props,
                ...props,
                showActions: true,
                dispatchConfirmedAction,
                rowIndex,
                requireReasonForReject,
              })
            ),
          )}
        </div>
      );
    } else {
      if ('undefined' !== typeof loadingPlaceholder) {
        return (<div {...css(LAZY_BOX_STYLE)}>{loadingPlaceholder}</div>);
      } else {
        return (<div {...css(LAZY_BOX_STYLE)}>{children}</div>);
      }
    }
  }

  async componentWillUpdate() {
    if (this.state.currentIndex !== this.props.rowIndex) {
      this.setState({ currentIndex: this.props.rowIndex });
      const comment = this.props.onRowRender(this.props.rowIndex);

      if ('undefined' !== typeof comment) {
        this.setState({ hasLoaded: true });
      }
    }
  }
}
