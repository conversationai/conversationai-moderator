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
import { Link } from 'react-router-dom';

import { getTopScore, getTopScoreForTag, ICommentModel, ITagModel, ModelId } from '../../../models';
import {
  IConfirmationAction,
  IModerationAction,
} from '../../../types';
import { REQUIRE_REASON_TO_REJECT } from '../../config';
import { useCachedComment } from '../../injectors/commentInjector';
import {
  articleBase,
  commentRepliesDetailsLink,
  searchLink,
} from '../../scenes/routes';
import {
  NICE_MIDDLE_BLUE,
} from '../../styles';
import { maybeCallback, partial } from '../../util';
import { css } from '../../utilx';
import { Avatar } from '../Avatar';
import { CommentText } from '../CommentText';
import {
  ConfirmationCircle,
} from '../ConfirmationCircle';
import { FlagsSummary } from '../FlagsSummary';
import {
  MoreVerticalIcon,
  ReplyIcon,
} from '../Icons';
import { ModerateButtons } from '../ModerateButtons';
import { ROW_STYLES } from '../styles';
import { ArticleTitle } from './components';

const AVATAR_SIZE = 24;

export type ILinkTargetGetter = (commentId: ModelId) => string;

export interface IBasicBodyProps {
  comment: ICommentModel;
  selectedTag?: ITagModel;
  hideCommentAction?: boolean;
  showActions?: boolean;
  dispatchConfirmedAction?(action: IConfirmationAction, ids: Array<string>): void;
  commentLinkTarget?: string;
  onCommentClick?(commentId: string): any;
  searchTerm?: string;
  displayArticleTitle?: boolean;
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
  onModerateButtonClick(comment: ICommentModel, action: IConfirmationAction): void {
    this.props.dispatchConfirmedAction(action, [comment.id]);
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
    );
  }

  render() {
    const {
      comment,
      selectedTag,
      hideCommentAction,
      commentLinkTarget,
      onCommentClick,
      displayArticleTitle,
      handleAssignTagsSubmit,
    } = this.props;

    const actionsAreVisible = this.state.hover || this.state.popupOpen;
    const activeButtons = this.getActiveButtons();

    let topScore = null;

    switch (selectedTag && selectedTag.key) {
      case undefined:
        break;
      case 'DATE':
        break;
      case 'SUMMARY_SCORE':
        topScore = getTopScore(comment);
        break;
      default:
        topScore = getTopScoreForTag(comment, selectedTag.id);
        break;
    }

    return(
      <div
        onMouseEnter={this.mouseEnter}
        onMouseLeave={this.mouseLeave}
        {...css(ROW_STYLES.comment, {flex: 1})}
      >
        {displayArticleTitle && <ArticleTitle articleId={comment.articleId}/>}
        <div key="body" {...css(ROW_STYLES.meta)}>
          <div key="text" {...css(ROW_STYLES.authorRow)}>
            { comment.replyToSourceId && (
              <Link
                to={commentRepliesDetailsLink({
                  context: articleBase,
                  contextId: comment.articleId,
                  commentId: comment.replyId,
                })}
                {...css(ROW_STYLES.reply)}
                onClick={partial(maybeCallback(onCommentClick), comment.id)}
              >
                <ReplyIcon {...css({fill: NICE_MIDDLE_BLUE})} size={24} />
              </Link>
              )}

            { comment.author?.avatar && (
              <span {...css({marginRight: '8px'})}>
                <Avatar size={AVATAR_SIZE} target={comment.author} />
              </span>
            )}
            { comment.author?.name && (
              <Link to={searchLink({searchByAuthor: true, term: comment.author.name})} {...css({ color: NICE_MIDDLE_BLUE })}>{comment.author.name}&nbsp;</Link>
            )}
            {comment.author?.location && (
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
                requireReasonForReject={REQUIRE_REASON_TO_REJECT}
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
                      backgroundColor={NICE_MIDDLE_BLUE}
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
                    backgroundColor={NICE_MIDDLE_BLUE}
                    action="highlight"
                    size={36}
                    iconSize={20}
                  />
                </div>
              )}
              { activeButtons && activeButtons.includes('reject') && (
                <div key="reject" {...css({ marginRight: '10px' })}>
                  <ConfirmationCircle
                    backgroundColor={NICE_MIDDLE_BLUE}
                    action="reject"
                    size={36}
                    iconSize={20}
                  />
                </div>
              )}
              { activeButtons && activeButtons.includes('defer') && (
                <div key="defer" {...css({ marginRight: '10px' })}>
                  <ConfirmationCircle
                    backgroundColor={NICE_MIDDLE_BLUE}
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
          <div {...css(ROW_STYLES.comment)}>
            { commentLinkTarget ? (
              <div {...css({ display: 'flex', flexDirection: 'column' })}>
                <p>
                  <CommentText text={comment.text} highlight={topScore}/>
                </p>
              </div>
            ) :
              <CommentText text={comment.text} highlight={topScore}/>
            }
          </div>
        </div>
      </div>
    );
  }
}

export interface ILinkedBasicBodyProps extends Omit<IBasicBodyProps, 'comment'> {
  commentId: ModelId;
  getLinkTarget: ILinkTargetGetter;
}

export function LinkedBasicBody(props: ILinkedBasicBodyProps) {
  const {
    commentId,
    getLinkTarget,
  } = props;

  const {comment} = useCachedComment(commentId);

  return (
    <div key={`${commentId}`}>
      <BasicBody {...props} comment={comment} commentLinkTarget={getLinkTarget(commentId)}/>
    </div>
  );
}
