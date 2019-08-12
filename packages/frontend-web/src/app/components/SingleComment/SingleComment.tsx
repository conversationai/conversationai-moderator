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
import React from 'react';
import { Link } from 'react-router-dom';

import {
  IAuthorCountsModel,
  ICommentFlagModel,
  ICommentModel,
  ICommentScoreModel,
  ICommentSummaryScoreModel,
  ITagModel,
  IUserModel,
} from '../../../models';
import { DATE_FORMAT_LONG } from '../../config';
import { editAndRescoreComment } from '../../platform/dataService';
import { FlagsSummary } from '../../scenes/Comments/components/FlagsSummary';
import { searchLink } from '../../scenes/routes';
import { ICommentSummaryScore } from '../../stores/commentSummaryScores';
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
  COMMENT_DETAIL_TAG_LIST_BUTTON_TYPE,
  DARK_PRIMARY_TEXT_COLOR,
  DARK_SECONDARY_TEXT_COLOR,
  DARK_TERTIARY_TEXT_COLOR,
  DIVIDER_COLOR,
  GREY_COLOR,
  GUTTER_DEFAULT_SPACING,
  LIGHT_PRIMARY_TEXT_COLOR,
  MEDIUM_COLOR,
  PALE_COLOR,
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
import { Button } from '../Button';
import {
  ApproveIcon,
  EditIcon,
  EmailIcon,
  FaceIcon,
  IdIcon,
  ReputationIcon,
} from '../Icons';
import { AnnotatedCommentText } from './components/AnnotatedCommentText';
import { CommentTags } from './components/CommentTags';

const ICON_SIZE = 20;
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
});

const DETAIL_LINK = {
  color: DARK_SECONDARY_TEXT_COLOR,
  textDecoration: 'none',
  ':focus': {
    outline: 0,
    textDecoration: 'underline',
  },
};

export interface IDetailRowProps {
  label: string | JSX.Element;
  value?: string;
  icon?: JSX.Element;
}
const DetailRow = ({ label, value, icon }: IDetailRowProps) => (
  <div {...css(DETAIL_STYLES.row)}>
    <div {...css(DETAIL_STYLES.icon)}>{value || icon}</div>
    <div {...css(DETAIL_STYLES.label)}>{label}</div>
  </div>
);

const STYLES = stylesheet({
  threaded: {
    flexBasis: '100%',
    maxWidth: `${REPLY_WIDTH}px`,
  },

  scoresLink: {
    ...BUTTON_RESET,
    ...BUTTON_LINK_TYPE,
    color: MEDIUM_COLOR,
    cursor: 'pointer',
    textAlign: 'left',
    marginTop: `${GUTTER_DEFAULT_SPACING}px`,
    marginBottom: `${GUTTER_DEFAULT_SPACING}px`,
    borderBottom: `2px solid transparent`,
    alignSelf: 'flex-start',
    ':focus': {
      outline: 0,
      borderBottom: `2px solid ${MEDIUM_COLOR}`,
    },
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

  linkFocus: {
    ':focus': {
      outline: 0,
      textDecoration: 'underline',
    },
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
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    flex: 1,
  },

  avatarColumn: {
    marginRight: 18,
    display: 'flex',
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

  tags: {
    display: 'flex',
    flexWrap: 'wrap',
  },

  tag: {
    ...BUTTON_RESET,
    ...COMMENT_DETAIL_TAG_LIST_BUTTON_TYPE,
    color: DARK_TERTIARY_TEXT_COLOR,
    marginRight: `${GUTTER_DEFAULT_SPACING}px`,
    marginBottom: `${GUTTER_DEFAULT_SPACING / 4}px`,
    display: 'flex',
    cursor: 'pointer',
    ':focus': {
      outline: 0,
      background: PALE_COLOR,
    },
  },

  label: {
    marginRight: `${BOX_DEFAULT_SPACING / 2}px`,
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

const FLAGS_STYLES = stylesheet({
  title: {
    ...CAPTION_TYPE,
    color: DARK_SECONDARY_TEXT_COLOR,
    fontSize: '20px',
  },
  entry: {
    padding: '10px',
    margin: '10px 0',
    backgroundColor: '#eee',
  },
  label: {
    fontSize: '24px',
  },
  resolvedText: {
    color: DARK_TERTIARY_TEXT_COLOR,
    fontSize: '16px',
    float: 'right',
  },
  detail: {
    fontSize: '14px',
  },
});

interface IRenderSummaryScoreProps {
  allTags?: List<ITagModel>;
  score: ICommentSummaryScoreModel;
  withColor?: boolean;
  onScoreClick?(score: ICommentSummaryScoreModel): void;
}

function RenderSummaryScore({allTags, score, withColor, onScoreClick}: IRenderSummaryScoreProps) {
  const tag = allTags.find((t) => (t.get('id') === score.tagId));
  if (!tag) {
    return;
  }
  function onClick() {
    onScoreClick && onScoreClick(score);
  }

  return (
    <button
      {...css(COMMENT_STYLES.tag, withColor ? { color : tag.color } : {})}
      key={score.tagId}
      onClick={onClick}
    >
      <div {...css(COMMENT_STYLES.label)}>{tag.label}</div>
      <div>{(score.score * 100).toFixed()}%</div>
    </button>
  );
}

export interface ISingleCommentProps {
  comment: ICommentModel;
  allScores?: List<ICommentScoreModel>;
  allScoresAboveThreshold?: List<ICommentScoreModel>;
  reducedScoresAboveThreshold?: List<ICommentScoreModel>;
  reducedScoresBelowThreshold?: List<ICommentScoreModel>;
  flags?: List<ICommentFlagModel>;
  isThreadedComment?: boolean;
  isReply?: boolean;
  allTags?: List<ITagModel>;
  availableTags?: List<ITagModel>;
  onScoreClick?(score: ICommentSummaryScoreModel): void;
  onTagButtonClick?(tagId: string): Promise<any>;
  onCommentTagClick?(commentScore: ICommentScoreModel): void;
  onAnnotateTagButtonClick?(tag: string, start: number, end: number): Promise<any>;
  url?: string;
  loadScores?(commentId: string): void;
  onUpdateCommentScore?(commentScore: ICommentScoreModel): void;
  onConfirmCommentScore?(commentid: string, commentScoreId: string): void;
  onRejectCommentScore?(commentid: string, commentScoreId: string): void;
  onResetCommentScore?(commentid: string, commentScoreId: string): void;
  onDeleteCommentTag?(id: string, commentScoreId: string): void;
  onRemoveCommentScore?(commentScore: ICommentScoreModel): void;
  authorCounts?: IAuthorCountsModel;
  getUserById?(id: string): IUserModel;
  currentUser?: IUserModel;
  summaryScores?: List<ICommentSummaryScore>;
  summaryScoresAboveThreshold?: List<ICommentSummaryScoreModel>;
  summaryScoresBelowThreshold?: List<ICommentSummaryScoreModel>;
  onUpdateCommentText?(comment: ICommentModel): void;
  commentEditingEnabled?: boolean;
}

export interface ISingleCommentState {
  scoresBelowThresholdVisible: boolean;
  inEditMode: boolean;
  isEditHovered: boolean;
  isEditFocused: boolean;
}

export class SingleComment extends React.PureComponent<ISingleCommentProps, ISingleCommentState> {

  state = {
    scoresBelowThresholdVisible: false,
    inEditMode: false,
    isEditHovered: false,
    isEditFocused: false,
  };

  authorLocation: HTMLDivElement = null;
  authorName: HTMLSpanElement = null;
  commentText: HTMLDivElement = null;

  @autobind
  toggleVisibleScores() {
    this.setState({
      scoresBelowThresholdVisible: !this.state.scoresBelowThresholdVisible,
    });
  }

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
    onUpdateCommentText(comment.set('text', commentText).setIn(['author', 'name'], authorName).setIn(['author', 'location'], authorLoc));
    // null out local scores for comment
    this.props.allScores.forEach((score) => (
     onRemoveCommentScore(score.set('score', null).set('annotationStart', null).set('annotationEnd', null))
    ));

    // send comment text to be update to publisher
    editAndRescoreComment(comment.get('id'), commentText, authorName, authorLoc);

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

  render() {
    const {
      comment,
      allScoresAboveThreshold,
      reducedScoresAboveThreshold,
      reducedScoresBelowThreshold,
      flags,
      availableTags,
      allTags,
      onTagButtonClick,
      onCommentTagClick,
      onAnnotateTagButtonClick,
      url,
      isReply,
      isThreadedComment,
      onScoreClick,
      loadScores,
      onUpdateCommentScore,
      onConfirmCommentScore,
      onRejectCommentScore,
      onResetCommentScore,
      onDeleteCommentTag,
      onRemoveCommentScore,
      authorCounts,
      getUserById,
      currentUser,
      summaryScoresAboveThreshold,
      summaryScoresBelowThreshold,
      onUpdateCommentText,
      commentEditingEnabled,
    } = this.props;

    const {
      scoresBelowThresholdVisible,
      inEditMode,
      isEditHovered,
      isEditFocused,
    } = this.state;

    const { author } = comment;
    const SUBMITTED_AT = formatDate(comment.sourceCreatedAt, DATE_FORMAT_LONG);

    const bodyStyling = css(COMMENT_STYLES.body);
    const className = bodyStyling.className ? bodyStyling.className + ' comment-body' : 'comment-body';

    function renderFlag(f: ICommentFlagModel) {
      let resolvedText = '';
      if (f.isResolved) {
        resolvedText += 'Resolved';
        if (f.resolvedAt) {
          resolvedText += ' on ' + (new Date(f.resolvedAt)).toLocaleDateString();
        }
      }
      else {
        resolvedText += 'Unresolved';
      }
      return (
        <div key={f.id} {...css(FLAGS_STYLES.entry)}>{resolvedText}
          <div key="label" {...css(FLAGS_STYLES.label)}>{f.label} <span {...css(FLAGS_STYLES.resolvedText)}>{resolvedText}</span></div>
          {f.detail && <div key="description" {...css(FLAGS_STYLES.detail)}>{f.detail}</div>}
        </div>
      );
    }

    return (
      <div {...css(isThreadedComment && isReply && STYLES.threaded)}>
        <div
          {...css(
            PROFILE_STYLES.base,
            isThreadedComment && PROFILE_STYLES.noBorder,
          )}
        >
          <div {...css(PROFILE_STYLES.header)}>
            { author.avatar && (
              <div key="avatarColumn" {...css(PROFILE_STYLES.avatarColumn)}>
                <img
                  src={author.avatar}
                  {...css(PROFILE_STYLES.avatar)}
                  alt={author.name}
                  width={AVATAR_SIZE}
                  height={AVATAR_SIZE}
                />
              </div>
            )}
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
                )
                }
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
                      )
                      }
                    </div>
                  )}
                </div>
                <div {...css(PROFILE_STYLES.details)}>
                  {authorCounts && (
                    <DetailRow
                      key="authorCounts"
                      icon={(
                        <ApproveIcon
                          {...css({ fill: DARK_SECONDARY_TEXT_COLOR })}
                          size={ICON_SIZE}
                        />
                      )}
                      label={
                        `${authorCounts.approvedCount} / ${(authorCounts.approvedCount + authorCounts.rejectedCount)}` +
                        ` approved`}
                    />
                  )}
                  {(author as any)['approvalRating'] && (
                    <DetailRow
                      key="author"
                      icon={(
                        <ReputationIcon
                          {...css({ fill: DARK_SECONDARY_TEXT_COLOR })}
                          size={ICON_SIZE}
                        />
                      )}
                      label={(author as any)['approvalRating']}
                    />
                  )}
                  {(author as any)['isSubscriber'] && (
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
                  )}
                  {author.email && (
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
                  )}

                  {comment.authorSourceId && (
                    <Link
                      key="authorSourceId"
                      to={searchLink({searchByAuthor: true, term: comment.authorSourceId.toString()})}
                      {...css(STYLES.linkFocus)}
                    >
                      <DetailRow
                        label={comment.authorSourceId.toString()}
                        icon={(
                          <IdIcon
                            {...css({ fill: DARK_SECONDARY_TEXT_COLOR })}
                            size={ICON_SIZE}
                          />
                        )}
                      />
                    </Link>
                  )}
                </div>
              </div>
            </div>
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
                onConfirmCommentScore={onConfirmCommentScore}
                onRejectCommentScore={onRejectCommentScore}
                onResetCommentScore={onResetCommentScore}
                onDeleteCommentTag={onDeleteCommentTag}
                onRemoveCommentScore={onRemoveCommentScore}
                onUpdateCommentScore={onUpdateCommentScore}
              />
            )}
          </div>
          {summaryScoresAboveThreshold && (
            <div {...css(COMMENT_STYLES.tags)}>
              {summaryScoresAboveThreshold.map((s) => (
                <RenderSummaryScore
                  key={s.tagId}
                  score={s}
                  allTags={allTags}
                  onScoreClick={onScoreClick}
                  withColor
                />
              ))}
            </div>
          )}
          {scoresBelowThresholdVisible && reducedScoresBelowThreshold && (
            <div>
              <div {...css(COMMENT_STYLES.tags)}>
                {summaryScoresBelowThreshold && (
                  <div {...css(COMMENT_STYLES.tags)}>
                    {summaryScoresBelowThreshold.map((s) => (
                      <RenderSummaryScore
                        key={s.tagId}
                        score={s}
                        allTags={allTags}
                        onScoreClick={onScoreClick}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
          {reducedScoresBelowThreshold && reducedScoresBelowThreshold.size > 0 && (
            <button
              aria-label={scoresBelowThresholdVisible ? 'Hide tags' : 'View all tags'}
              type="button"
              {...css(STYLES.scoresLink)}
              onClick={this.toggleVisibleScores}
            >
              {scoresBelowThresholdVisible ? 'Hide tags' : 'View all tags'}
            </button>
          )}
          {flags && flags.size > 0 && (
            <div key="flags">
              <div key="__flags-title" {...css(FLAGS_STYLES.title)}>Flags</div>
              {flags.map((f) => renderFlag(f))}
            </div>
          )}
        </div>
      </div>
    );
  }
}
