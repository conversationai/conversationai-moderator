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
import formatDate from 'date-fns/format';
import { List } from 'immutable';
import React, {Fragment} from 'react';
import { Link } from 'react-router-dom';

import {
  ICommentModel,
  ICommentScoreModel,
  ICommentSummaryScoreModel,
  ITagModel,
  IUserModel,
} from '../../../models';
import { DATE_FORMAT_LONG } from '../../config';
import { searchLink } from '../../scenes/routes';
import { editAndRescoreComment } from '../../stores/commentActions';
import {
  ARTICLE_CATEGORY_TYPE,
  ARTICLE_HEADLINE_TYPE,
  BOTTOM_BORDER_TRANSITION,
  BOX_DEFAULT_SPACING,
  BUTTON_LINK_TYPE,
  BUTTON_RESET,
  CAPTION_TYPE,
  COMMENT_DETAIL_BODY_TEXT_TYPE,
  COMMENT_DETAIL_DATE_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  DARK_SECONDARY_TEXT_COLOR,
  DARK_TERTIARY_TEXT_COLOR,
  DIVIDER_COLOR,
  GREY_COLOR,
  GUTTER_DEFAULT_SPACING,
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
  TAG_INCOHERENT_COLOR,
  TAG_INFLAMMATORY_COLOR,
  TAG_OBSCENE_COLOR,
  TAG_OFF_TOPIC_COLOR,
  TAG_OTHER_COLOR,
  TAG_SPAM_COLOR,
  TAG_UNSUBSTANTIAL_COLOR,
  WHITE_COLOR,
} from '../../styles';
import { css, stylesheet } from '../../utilx';
import { Avatar } from '../Avatar';
import { Button } from '../Button';
import { FlagsSummary } from '../FlagsSummary';
import {
  EditIcon,
} from '../Icons';
import { AnnotatedCommentText } from './components/AnnotatedCommentText';
import { AuthorCounts } from './components/AuthorCounts';
import { CommentTags } from './components/CommentTags';
import {
  ApprovalRatingRow,
  EmailRow,
  ICON_SIZE,
  IsSubscriberRow,
  SourceIdRow,
} from './components/DetailRow';
import { FlagsList } from './components/FlagsList';
import { SummaryScores } from './components/SummaryScore';

const AVATAR_SIZE = 60;
// const COMMENT_WIDTH = 696;
const REPLY_WIDTH = 642;

// Styling by class and inserting style element rather than inline styles
// in order to style ::selection.
const COMMENT_BODY_STYLES = `
  .comment-body a {
    text-decoration: underline;
  }

  .comment-body b {
    color: #f00;
  }

  .comment-body::selection,
  .comment-body *::selection {
    background: ${MEDIUM_COLOR};
    borderColor: ${LIGHT_PRIMARY_TEXT_COLOR};
    color: ${LIGHT_PRIMARY_TEXT_COLOR};
  }

  .tag {
    border-bottom-width: 1px;
    border-bottom-style: solid;
  }

  .tag-obscene {
    border-bottom-color: ${TAG_OBSCENE_COLOR};
    color: ${TAG_OBSCENE_COLOR};
  }

  .tag-incoherent {
    border-bottom-color: ${TAG_INCOHERENT_COLOR};
    color: ${TAG_INCOHERENT_COLOR};
  }

  .tag-spam {
    border-bottom-color: ${TAG_SPAM_COLOR};
    color: ${TAG_SPAM_COLOR};
  }

  .tag-off-topic {
    border-bottom-color: ${TAG_OFF_TOPIC_COLOR};
    color: ${TAG_OFF_TOPIC_COLOR};
  }

  .tag-inflammatory {
    border-bottom-color: ${TAG_INFLAMMATORY_COLOR};
    color: ${TAG_INFLAMMATORY_COLOR};
  }

  .tag-unsubstantial {
    border-bottom-color: ${TAG_UNSUBSTANTIAL_COLOR};
    color: ${TAG_UNSUBSTANTIAL_COLOR};
  }

  .tag-other {
    border-bottom-color: ${TAG_OTHER_COLOR};
    color: ${TAG_OTHER_COLOR};
  }
`;

const STYLES = stylesheet({
  threaded: {
    flexBasis: '100%',
    maxWidth: `${REPLY_WIDTH}px`,
  },

  editButton: {
    ...BUTTON_RESET,
    ...CAPTION_TYPE,
    color: DARK_SECONDARY_TEXT_COLOR,
    borderRadius: 2,
    marginTop: '10px',
    height: '36px',
    width: '36px',
    padding: '6px',
    cursor: 'pointer',
    marginLeft: '10px',

    ':hover': {
      backgroundColor: MEDIUM_COLOR,
    },

    ':focus': {
      backgroundColor: MEDIUM_COLOR,
      outline: 0,
    },
  },

  contentEditableContainer: {
    display: 'inline-block',
    outline: `2px solid ${DIVIDER_COLOR}`,
    outlineOffset: '2px',
    userSelect: 'text',
    ':focus': {
      outline: `2px solid ${GREY_COLOR}`,
    },
  },

  commentTaggingContainer: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },

  buttonGroup: {
    display: 'flex',
    flexDirection: 'row',
    backgroundColor: WHITE_COLOR,
    justifyContent: 'flex-end',
    marginTop: `${GUTTER_DEFAULT_SPACING}px`,
  },

  cancel: {
    backgroundColor: WHITE_COLOR,
    color: DARK_PRIMARY_TEXT_COLOR,
    border: `1px solid ${DIVIDER_COLOR}`,
    marginLeft: `${GUTTER_DEFAULT_SPACING}px`,
    padding: '8px 17px 7px 17px',
    cursor: 'pointer',
    ':active': {
      backgroundColor: DIVIDER_COLOR,
    },
    ':focus': {
      backgroundColor: DIVIDER_COLOR,
    },
  },

  save: {
    backgroundColor: MEDIUM_COLOR,
    color: WHITE_COLOR,
    padding: '8px 17px 7px 17px',
    cursor: 'pointer',
  },
});

const PROFILE_STYLES = stylesheet({
  base: {
    width: '100%',
    display: 'flex',
    flexWrap: 'no-wrap',
    alignItems: 'baseline',
    padding: `${GUTTER_DEFAULT_SPACING}px 0`,
    borderBottom: '2px solid ' + DIVIDER_COLOR,
  },

  noBorder: {
    borderBottom: 'none',
  },

  header: {
    display: 'flex',
    width: '100%',
    alignItems: 'center',
  },

  avatar: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    overflow: 'hidden',
    background: DIVIDER_COLOR,
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
  },

  nameColumn: {
    marginLeft: '35px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    flex: 1,
  },

  name: {
    ...ARTICLE_HEADLINE_TYPE,
    color: DARK_PRIMARY_TEXT_COLOR,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  meta: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: '5px',
  },

  authorName: {
    color: DARK_PRIMARY_TEXT_COLOR,
    userSelect: 'text',
    ':focus': {
      outline: 0,
      textDecoration: 'underline',
    },
  },

  location: {
    ...CAPTION_TYPE,
    color: DARK_SECONDARY_TEXT_COLOR,
    marginRight: `${BOX_DEFAULT_SPACING}px`,
    userSelect: 'text',
  },

  details: {
    display: 'flex',
    flexWrap: 'no-wrap',
  },
});

const COMMENT_STYLES = stylesheet({
  base: {
    display: 'flex',
    flexDirection: 'column',
  },

  meta: {
    display: 'flex',
    marginTop: `${GUTTER_DEFAULT_SPACING}px`,
    marginBottom: `${GUTTER_DEFAULT_SPACING}px`,
  },

  bullet: {
    ...ARTICLE_CATEGORY_TYPE,
    color: DARK_TERTIARY_TEXT_COLOR,
    margin: '0 5px',
  },

  link: {
    color: MEDIUM_COLOR,
    textDecoration: 'none',
    ':focus': {
      outline: 0,
      textDecoration: 'underline',
    },
  },

  flags: {
    ...ARTICLE_CATEGORY_TYPE,
    color: DARK_TERTIARY_TEXT_COLOR,
    textTransform: 'uppercase',
  },

  body: {
    ...COMMENT_DETAIL_BODY_TEXT_TYPE,
    color: DARK_PRIMARY_TEXT_COLOR,
    fontSize: '20px',
    position: 'relative',
    wordWrap: 'break-word',
    marginBottom: `${GUTTER_DEFAULT_SPACING * 4}px`,
    whiteSpace: 'pre-wrap',
  },

  scoreDetails: {
    ...BUTTON_LINK_TYPE, BOTTOM_BORDER_TRANSITION,
    color: MEDIUM_COLOR,
    marginTop: `${GUTTER_DEFAULT_SPACING}px`,
    display: 'block',
    maxWidth: 115,
    ':hover': {
      transition: 'all 0.3 ease',
      borderBottomColor: MEDIUM_COLOR,
    },
    ':focus': {
      borderBottomColor: MEDIUM_COLOR,
    },
  },

  metaType: {
    ...COMMENT_DETAIL_DATE_TYPE,
    color: DARK_SECONDARY_TEXT_COLOR,
  },
});

export interface ISingleCommentProps {
  comment: ICommentModel;
  allScores?: Array<ICommentScoreModel>;
  allScoresAboveThreshold?: Array<ICommentScoreModel>;
  reducedScoresAboveThreshold?: Array<ICommentScoreModel>;
  isThreadedComment?: boolean;
  isReply?: boolean;
  availableTags?: List<ITagModel>;
  onScoreClick?(score: ICommentSummaryScoreModel): void;
  onTagButtonClick?(tagId: string): Promise<any>;
  onCommentTagClick?(commentScore: ICommentScoreModel): void;
  onAnnotateTagButtonClick?(tag: string, start: number, end: number): Promise<any>;
  url?: string;
  loadScores?(commentId: string): void;
  onUpdateCommentScore?(commentScore: ICommentScoreModel): void;
  onDeleteCommentTag?(id: string, commentScoreId: string): void;
  onRemoveCommentScore?(commentScore: ICommentScoreModel): void;
  getUserById?(id: string): IUserModel;
  currentUser?: IUserModel;
  onUpdateCommentText?(comment: ICommentModel): void;
  commentEditingEnabled?: boolean;
}

export interface ISingleCommentState {
  inEditMode: boolean;
  isEditHovered: boolean;
  isEditFocused: boolean;
}

export class SingleComment extends React.PureComponent<ISingleCommentProps, ISingleCommentState> {

  state = {
    inEditMode: false,
    isEditHovered: false,
    isEditFocused: false,
  };

  authorLocation: HTMLDivElement = null;
  authorName: HTMLSpanElement = null;
  commentText: HTMLDivElement = null;

  @autobind
  handleEditCommentClick() {
    this.setState({
      inEditMode: !this.state.inEditMode,
    });
  }

  @autobind
  saveAuthorLocationRef(elem: HTMLDivElement) {
    this.authorLocation = elem;
  }

  @autobind
  saveAuthorNameRef(elem: HTMLSpanElement) {
    this.authorName = elem;
  }

  @autobind
  saveCommentTextRef(elem: HTMLDivElement) {
    this.commentText = elem;
  }

  @autobind
  saveEditedCommentText(e: React.FormEvent<any>) {
    e.preventDefault();
    const {
      onUpdateCommentText,
      onRemoveCommentScore,
      comment,
    } = this.props;

    // grab new author name and location text
    const authorName = this.authorName.innerText;
    const authorLoc = this.authorLocation.innerText;
    const commentText = this.commentText.innerText;

    // reset comment text and author
    const author = {...comment.author, name: authorName, location: authorLoc};
    onUpdateCommentText({
      ...comment,
      text: commentText,
      author,
    });
    // null out local scores for comment
    this.props.allScores.forEach((score) => (
      onRemoveCommentScore({
        ...score,
        score: null,
        annotationStart: null,
        annotationEnd: null,
      })
    ));

    // send comment text to be update to publisher
    editAndRescoreComment(comment.id, commentText, author);

    this.setState({
      inEditMode: false,
    });
  }

  @autobind
  cancelEditedCommentText(e: React.FormEvent<any>) {
    e.preventDefault();
    this.setState({
      inEditMode: false,
    });
  }

  @autobind
  onEditMouseEnter() {
    this.setState({ isEditHovered: true });
  }

  @autobind
  onEditMouseLeave() {
    this.setState({ isEditHovered: false });
  }

  @autobind
  onEditFocus() {
    this.setState({ isEditFocused: true });
  }

  @autobind
  onEditBlur() {
    this.setState({ isEditFocused: false });
  }

  @autobind
  focusText() {
    this.commentText.focus();
  }

  @autobind
  focusName() {
    this.authorName.focus();
  }

  @autobind
  focusLocation() {
    this.authorLocation.focus();
  }

  renderAuthor() {
    const {comment} = this.props;
    const {inEditMode} = this.state;

    const { author } = this.props.comment;
    if (!author) {
      return null;
    }
    return (
      <Fragment>
        {author.avatar && <Avatar key="avatarColumn" target={author} size={60}/>}
        <div key="nameColumn" {...css(PROFILE_STYLES.nameColumn)}>
          <div {...css(PROFILE_STYLES.name)}>
            {!inEditMode ? (
              <Link
                to={searchLink({searchByAuthor: true, term: author.name})}
                key="authorName"
                {...css(PROFILE_STYLES.authorName)}
              >
                {author.name}
              </Link>
            ) : (
              <span
                key="authorNameEditable"
                contentEditable
                suppressContentEditableWarning
                ref={this.saveAuthorNameRef}
                onClick={this.focusName}
                {...css(STYLES.contentEditableContainer, {minWidth: '300px'})}
              >
                {author.name}
              </span>
            )}
          </div>
          <div {...css(PROFILE_STYLES.meta)}>
            <div>
              {author.location && (
                <div key="location" {...css(PROFILE_STYLES.location)}>
                  {!inEditMode ? (
                    <span key="authorLocation">{author.location}</span>
                  ) : (
                    <span
                      key="authorLocationEditable"
                      contentEditable
                      suppressContentEditableWarning
                      ref={this.saveAuthorLocationRef}
                      onClick={this.focusLocation}
                      {...css(STYLES.contentEditableContainer)}
                    >
                      {author.location}
                    </span>
                  )}
                </div>
              )}
            </div>
            <div {...css(PROFILE_STYLES.details)}>
              <AuthorCounts authorSourceId={comment.authorSourceId}/>
              {author.approvalRating && (<ApprovalRatingRow approvalRating={author.approvalRating}/>)}
              {author.isSubscriber && (<IsSubscriberRow/>)}
              {author.email && (<EmailRow author={author}/>)}
              {comment.authorSourceId && (<SourceIdRow authorSourceId={comment.authorSourceId}/>)}
            </div>
          </div>
        </div>
      </Fragment>
    );
  }

  render() {
    const {
      comment,
      allScoresAboveThreshold,
      reducedScoresAboveThreshold,
      availableTags,
      onTagButtonClick,
      onCommentTagClick,
      onAnnotateTagButtonClick,
      url,
      isReply,
      isThreadedComment,
      onScoreClick,
      loadScores,
      onUpdateCommentScore,
      onDeleteCommentTag,
      onRemoveCommentScore,
      getUserById,
      currentUser,
      onUpdateCommentText,
      commentEditingEnabled,
    } = this.props;

    const {
      inEditMode,
      isEditHovered,
      isEditFocused,
    } = this.state;

    const SUBMITTED_AT = formatDate(comment.sourceCreatedAt, DATE_FORMAT_LONG);

    const bodyStyling = css(COMMENT_STYLES.body);
    const className = bodyStyling.className ? bodyStyling.className + ' comment-body' : 'comment-body';

    return (
      <div {...css(isThreadedComment && isReply && STYLES.threaded)}>
        <div
          {...css(
            PROFILE_STYLES.base,
            isThreadedComment && PROFILE_STYLES.noBorder,
          )}
        >
          <div {...css(PROFILE_STYLES.header)}>
            {this.renderAuthor()}
          </div>
        </div>
        <div {...css(COMMENT_STYLES.base)}>
          <div {...css(STYLES.commentTaggingContainer)}>
            <CommentTags
              scores={reducedScoresAboveThreshold}
              availableTags={availableTags}
              onClick={onTagButtonClick}
              onCommentTagClick={onCommentTagClick}
            />

            {onUpdateCommentText && commentEditingEnabled &&
              (
                <button
                  aria-label="Edit Comment Text"
                  onMouseEnter={this.onEditMouseEnter}
                  onMouseLeave={this.onEditMouseLeave}
                  onFocus={this.onEditFocus}
                  onBlur={this.onEditBlur}
                  {...css(STYLES.editButton)}
                  onClick={this.handleEditCommentClick}
                >
                  <EditIcon
                    {...css({
                      fill: isEditHovered || isEditFocused
                          ? LIGHT_PRIMARY_TEXT_COLOR
                          : MEDIUM_COLOR,
                    })}
                    size={ICON_SIZE}
                  />
                </button>
              )
            }
          </div>
          <div
            {...css(
              COMMENT_STYLES.meta,
              /* url && COMMENT_STYLES.metaModerating, */
            )}
          >
            <div {...css(COMMENT_STYLES.metaType)}>
              {url ? (
                <Link key="submittedAt" to={url} {...css(COMMENT_STYLES.link)}>{SUBMITTED_AT} </Link>
              ) : (
                <span key="submittedAt">{SUBMITTED_AT} </span>
              )}
              <FlagsSummary comment={comment} full/>
            </div>
          </div>
          <style>{COMMENT_BODY_STYLES}</style>
          <div className={className} style={bodyStyling.style}>
            {inEditMode ? (
              <div>
                <div
                  key="content"
                  contentEditable
                  suppressContentEditableWarning
                  ref={this.saveCommentTextRef}
                  onClick={this.focusText}
                  {...css(STYLES.contentEditableContainer)}
                >
                  {comment.text}
                </div>
                <div
                  key="buttons"
                  {...css(STYLES.buttonGroup)}
                >
                  <Button
                    key="save"
                    label="Save"
                    onClick={this.saveEditedCommentText}
                    buttonStyles={STYLES.save}
                  />
                  <Button
                    key="cancel"
                    label="Cancel"
                    onClick={this.cancelEditedCommentText}
                    buttonStyles={STYLES.cancel}
                  />
                </div>
              </div>
            ) : (
              <AnnotatedCommentText
                scores={allScoresAboveThreshold}
                availableTags={availableTags}
                text={comment.text}
                loadScores={loadScores}
                onClick={onAnnotateTagButtonClick}
                getUserById={getUserById}
                currentUser={currentUser}
                onDeleteCommentTag={onDeleteCommentTag}
                onRemoveCommentScore={onRemoveCommentScore}
                onUpdateCommentScore={onUpdateCommentScore}
              />
            )}
          </div>
          <SummaryScores comment={comment} onScoreClick={onScoreClick}/>
          <FlagsList commentId={comment.id}/>
        </div>
      </div>
    );
  }
}
