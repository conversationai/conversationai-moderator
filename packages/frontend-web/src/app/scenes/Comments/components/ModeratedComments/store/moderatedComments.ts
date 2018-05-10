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

import { fromJS, List, Map } from 'immutable';
import { createAction, handleActions } from 'redux-actions';
import { makeTypedFactory, TypedRecord} from 'typed-immutable-record';
import { IAppStateRecord, IThunkAction } from '../../../../../stores';
import {
  approveComment,
  deferComment,
  highlightComment,
  rejectComment,
  resetComment,
} from '../../../../../stores/comments';
import {
  getModeratedCommentIdsForArticle as fetchModeratedCommentIdsForArticle,
  getModeratedCommentIdsForCategory as fetchModeratedCommentIdsForCategory,
} from '../../../../../util';

import { DATA_PREFIX } from './reduxPrefix';

export const updateCommentStateAction: {
  [key: string]: any;
} = {
  highlight: highlightComment,
  approve: approveComment,
  defer: deferComment,
  reject: rejectComment,
  reset: resetComment,
};

const ACTION_PLURAL: {
  [key: string]: string;
} = {
  highlight: 'highlighted',
  approve: 'approved',
  defer: 'deferred',
  reject: 'rejected',
  tag: 'tagged',
};

const MODERATED_COMMENTS_FOR_ARTICLE_DATA = [...DATA_PREFIX, 'moderatedComments', 'articles'];
const MODERATED_COMMENTS_FOR_CATEGORY_DATA = [...DATA_PREFIX, 'moderatedComments', 'categories'];
const MODERATED_COMMENTS_IS_LOADING = [...MODERATED_COMMENTS_FOR_ARTICLE_DATA, 'isLoading'];

const loadModeratedCommentsStart = createAction(
  'article-detail-moderatored/LOAD_MODERATED_COMMENTS_START',
);

type ILoadModeratedCommentsForArticleCompletePayload = {
  articleId: string;
  moderatedComments: Map<string, List<number>>;
};
const loadModeratedCommentsForArticleComplete = createAction<ILoadModeratedCommentsForArticleCompletePayload>(
  'article-detail-moderatored/LOAD_MODERATED_COMMENTS_FOR_ARTICLE_COMPLETE',
);

type ILoadModeratedCommentsForCategoriesCompletePayload = {
  category: number | 'all';
  moderatedComments: Map<string, List<number>>;
};
const loadModeratedCommentsForCategoryComplete = createAction<ILoadModeratedCommentsForCategoriesCompletePayload>(
  'article-detail-moderatored/LOAD_MODERATED_COMMENTS_FOR_CATEGORY_COMPLETE',
);

type ISetCommentsModerationForArticlesPayload = {
  articleId: string;
  commentIds: List<string>;
  moderationAction: string;
  currentModeration: string;
};
const setCommentsModerationForArticlesAction = createAction<ISetCommentsModerationForArticlesPayload>(
  'article-detail-moderatored/SET_MODERATED_COMMENTS_STATUS_FOR_ARTICLES',
);

type ISetCommentsModerationForCategoriesPayload = {
  category: string | 'all';
  commentIds: List<string>;
  moderationAction: string;
  currentModeration: string;
};
const setCommentsModerationForCategoriesAction = createAction<ISetCommentsModerationForCategoriesPayload>(
  'article-detail-moderatored/SET_MODERATED_COMMENTS_STATUS_FOR_CATEGORIES',
);

export function loadModeratedCommentsForArticle(articleId: string, sort: Array<string>): IThunkAction<void> {
  return async (dispatch) => {
    dispatch(loadModeratedCommentsStart());

    const moderatedComments = await fetchModeratedCommentIdsForArticle(articleId, sort);

    await dispatch(loadModeratedCommentsForArticleComplete({ articleId, moderatedComments }));
  };
}

export function loadModeratedCommentsForCategory(category: string | 'all', sort: Array<string>): IThunkAction<Promise<void>> {
  return async (dispatch) => {
    dispatch(loadModeratedCommentsStart());

    const moderatedComments = await fetchModeratedCommentIdsForCategory(category, sort);

    await dispatch(loadModeratedCommentsForCategoryComplete({ category, moderatedComments }));
  };
}

export function setCommentsModerationForArticle(articleId: string, commentIds: Array<string>, moderationAction: string, currentModeration: string): IThunkAction<void> {
  return (dispatch) => {
    dispatch(updateCommentStateAction[moderationAction](commentIds));
    dispatch(setCommentsModerationForArticlesAction({articleId, commentIds, moderationAction, currentModeration}));
  };
}

export function setCommentsModerationForCategory(category: string, commentIds: Array<string>, moderationAction: string, currentModeration: string): IThunkAction<void> {
  return (dispatch) => {
    dispatch(updateCommentStateAction[moderationAction](commentIds));
    dispatch(setCommentsModerationForCategoriesAction({category, commentIds, moderationAction, currentModeration}));
  };
}

export interface IModeratedCommentsState {
  isLoading: boolean;
  articles: Map<string, Map<string, List<number>>>;
  categories: Map<string, Map<string, List<number>>>;
}

export interface IModeratedCommentsStateRecord extends TypedRecord<IModeratedCommentsStateRecord>, IModeratedCommentsState {}

const StateFactory = makeTypedFactory<IModeratedCommentsState, IModeratedCommentsStateRecord>({
  isLoading: true,
  articles: Map<string, Map<string, List<number>>>(),
  categories: Map<string, Map<string, List<number>>>(),
});

const initialState = StateFactory();

export const moderatedCommentsReducer = handleActions<
  IModeratedCommentsStateRecord,
  void                                               | // loadModeratedCommentsStart
  ILoadModeratedCommentsForArticleCompletePayload    | // loadModeratedCommentsForArticleComplete
  ILoadModeratedCommentsForCategoriesCompletePayload | // loadModeratedCommentsForCategoryComplete
  ISetCommentsModerationForArticlesPayload           | // setCommentsModerationForArticlesAction
  ISetCommentsModerationForCategoriesPayload
>({
  [loadModeratedCommentsStart.toString()]: (state) => (
    state
      .set('isLoading', true)
  ),

  [loadModeratedCommentsForArticleComplete.toString()]: (state, { payload: { articleId, moderatedComments } }: { payload: ILoadModeratedCommentsForArticleCompletePayload }) => (
    state
      .set('isLoading', false)
      .setIn(['articles', articleId], fromJS(moderatedComments))
  ),

  [loadModeratedCommentsForCategoryComplete.toString()]: (state, { payload: { category, moderatedComments } }: { payload: ILoadModeratedCommentsForCategoriesCompletePayload }) => (
    state
      .set('isLoading', false)
      .setIn(['categories', category.toString()], fromJS(moderatedComments))
  ),

  [setCommentsModerationForArticlesAction.toString()]: (state, { payload: { articleId, commentIds, moderationAction, currentModeration } }: { payload: ISetCommentsModerationForArticlesPayload }) => {
    let newState = state;
    commentIds.forEach((commentId: string) => {
      const shouldRemoveFromList = currentModeration !== 'flagged' &&
          currentModeration !== 'recommended' &&
          currentModeration !== 'batched' &&
          currentModeration !== 'automated' &&
          ((currentModeration === 'highlighted' && moderationAction === 'highlight') ||
          (currentModeration !== 'highlighted' && moderationAction !== 'highlight'));

      if (shouldRemoveFromList) {
        newState = newState.updateIn(['articles', articleId, currentModeration],
            (moderated) => moderated.delete(moderated.findIndex((item: string) => item === commentId)));
      }

      switch (moderationAction) {
        case 'reject' || 'defer':
          return ( newState =
            newState
              .updateIn(['articles', articleId, ACTION_PLURAL[moderationAction]],
                  (item) => item.push(commentId))
          );
        case 'highlight':
          if (currentModeration === 'highlighted' && moderationAction === 'highlight') {
            return newState;
          }

          return ( newState =
            newState
              .updateIn(['articles', articleId, ACTION_PLURAL[moderationAction]],
                  (item) => item.push(commentId))
              .updateIn(['articles', articleId, 'approved'],
                  (item) => item.push(commentId))
          );
        case 'reset':
          return newState;
        default:
          return ( newState =
            newState
              .updateIn(['articles', articleId, ACTION_PLURAL[moderationAction]],
                  (item) => item.push(commentId))
          );
      }
    });

    return newState;
  },

  [setCommentsModerationForCategoriesAction.toString()]: (state, { payload: { category, commentIds, moderationAction, currentModeration } }: { payload: ISetCommentsModerationForCategoriesPayload }) => {
    let newState = state;
    commentIds.forEach((commentId: string) => {
      const shouldRemoveFromList = currentModeration !== 'flagged' &&
          currentModeration !== 'recommended' &&
          currentModeration !== 'batched' &&
          currentModeration !== 'automated' &&
          ((currentModeration === 'highlighted' && moderationAction === 'highlight') ||
          (currentModeration !== 'highlighted' && moderationAction !== 'highlight'));

      if (shouldRemoveFromList) {
        newState = newState.updateIn(['categories', category.toString(), currentModeration],
            (moderated) => moderated.delete(moderated.findIndex((item: string) => item === commentId)));
      }
      switch (moderationAction) {
        case 'reject' || 'defer':
          return ( newState =
            newState
              .updateIn(['categories', category, ACTION_PLURAL[moderationAction]],
                  (item) => item.push(commentId))
          );
        case 'highlight':
          if (currentModeration === 'highlighted' && moderationAction === 'highlight') {
            return newState;
          }

          return ( newState =
            newState
              .updateIn(['categories', category, ACTION_PLURAL[moderationAction]],
                  (item) => item.push(commentId))
              .updateIn(['categories', category, 'approved'],
                  (item) => item.push(commentId))
          );
        case 'reset':
          return newState;
        default:
          return ( newState =
            newState
              .updateIn(['categories', category, ACTION_PLURAL[moderationAction]],
                  (item) => item.push(commentId))
          );
      }
    });

    return newState;
  },
}, initialState);

export function getModeratedCommentsForArticle(state: IAppStateRecord): Map<string, Map<string, List<string>>> {
  return state.getIn(MODERATED_COMMENTS_FOR_ARTICLE_DATA);
}

export function getModeratedCommentsForCategory(state: IAppStateRecord): Map<string, Map<string, List<string>>> {
  return state.getIn(MODERATED_COMMENTS_FOR_CATEGORY_DATA);
}

export function getModeratedCommentsIsLoading(state: IAppStateRecord): boolean {
  return state.getIn(MODERATED_COMMENTS_IS_LOADING);
}

export function getModeratedComments(state: IAppStateRecord, params: any): Map<string, List<string>> {
  if (!!params.articleId) {
    const articles = getModeratedCommentsForArticle(state);
    const articleId = params.articleId;
    if (articles && articles.has(articleId)) {
      return articles.get(articleId);
    }
  } else {
    const categories = getModeratedCommentsForCategory(state);
    const categoryId = params.categoryId.toString();
    if (categories && categories.has(categoryId)) {
      return categories.get(categoryId);
    }
  }

  return Map<string, List<string>>({
    approved: List<string>(),
    highlighted: List<string>(),
    rejected: List<string>(),
    deferred: List<string>(),
    flagged: List<string>(),
    recommended: List<string>(),
    batched: List<string>(),
    automated: List<string>(),
  });
}
