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
import { Action, createAction, handleActions } from 'redux-actions';

import {
  getModeratedCommentIdsForArticle as fetchModeratedCommentIdsForArticle,
  getModeratedCommentIdsForCategory as fetchModeratedCommentIdsForCategory,
  IModeratedComments,
} from '../../../../../platform/dataService';
import { IAppStateRecord, IThunkAction } from '../../../../../stores';
import {
  approveComment,
  deferComment,
  highlightComment,
  rejectComment,
  resetComment,
} from '../../../../../stores/comments';
import { IModeratedCommentsPathParams, isArticleContext } from '../../../../routes';
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

const loadModeratedCommentsStart = createAction(
  'article-detail-moderatored/LOAD_MODERATED_COMMENTS_START',
);

type ILoadModeratedCommentsForArticleCompletePayload = {
  articleId: string;
  moderatedComments: IModeratedComments;
};
const loadModeratedCommentsForArticleComplete = createAction<ILoadModeratedCommentsForArticleCompletePayload>(
  'article-detail-moderatored/LOAD_MODERATED_COMMENTS_FOR_ARTICLE_COMPLETE',
);

type ILoadModeratedCommentsForCategoriesCompletePayload = {
  category: string | 'all';
  moderatedComments: IModeratedComments;
};
const loadModeratedCommentsForCategoryComplete = createAction<ILoadModeratedCommentsForCategoriesCompletePayload>(
  'article-detail-moderatored/LOAD_MODERATED_COMMENTS_FOR_CATEGORY_COMPLETE',
);

type ISetCommentsModerationForArticlesPayload = {
  articleId: string;
  commentIds: Array<string>;
  moderationAction: string;
  currentModeration: string;
};
const setCommentsModerationForArticlesAction = createAction<ISetCommentsModerationForArticlesPayload>(
  'article-detail-moderatored/SET_MODERATED_COMMENTS_STATUS_FOR_ARTICLES',
);

type ISetCommentsModerationForCategoriesPayload = {
  category: string | 'all';
  commentIds: Array<string>;
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

export type IModeratedCommentsState = Readonly<{
  isLoading: boolean;
  articles: Map<string, Map<string, List<string>>>;
  categories: Map<string, Map<string, List<string>>>;
}>;

const initialState = {
  isLoading: true,
  articles: Map<string, Map<string, List<string>>>(),
  categories: Map<string, Map<string, List<string>>>(),
};

export const moderatedCommentsReducer = handleActions<
  IModeratedCommentsState,
  void                                               | // loadModeratedCommentsStart
  ILoadModeratedCommentsForArticleCompletePayload    | // loadModeratedCommentsForArticleComplete
  ILoadModeratedCommentsForCategoriesCompletePayload | // loadModeratedCommentsForCategoryComplete
  ISetCommentsModerationForArticlesPayload           | // setCommentsModerationForArticlesAction
  ISetCommentsModerationForCategoriesPayload
>({
  [loadModeratedCommentsStart.toString()]: (state) => ({...state, isLoading: true}),

  [loadModeratedCommentsForArticleComplete.toString()]: (state, { payload }: Action<ILoadModeratedCommentsForArticleCompletePayload>) => {
    const { articleId, moderatedComments } = payload;
    return { ...state, isLoading: false, articles: state.articles.set(articleId, fromJS(moderatedComments))};
  },

  [loadModeratedCommentsForCategoryComplete.toString()]: (state, { payload }: Action<ILoadModeratedCommentsForCategoriesCompletePayload>) => {
    const { category, moderatedComments } = payload;
    return { ...state, isLoading: false, categories: state.categories.set(category, fromJS(moderatedComments))};
  },

  [setCommentsModerationForArticlesAction.toString()]: (state, { payload }: Action<ISetCommentsModerationForArticlesPayload>) => {
    const { articleId, commentIds, moderationAction, currentModeration } = payload;
    const newState = {...state};
    commentIds.forEach((commentId: string) => {
      const shouldRemoveFromList =
          currentModeration !== 'batched' &&
          currentModeration !== 'automated' &&
          ((currentModeration === 'highlighted' && moderationAction === 'highlight') ||
          (currentModeration !== 'highlighted' && moderationAction !== 'highlight'));

      if (shouldRemoveFromList) {
        newState.articles = newState.articles.updateIn([articleId, currentModeration],
            (moderated) => moderated.delete(moderated.findIndex((item: string) => item === commentId)));
      }

      switch (moderationAction) {
        case 'reject' || 'defer':
          newState.articles.updateIn([articleId, ACTION_PLURAL[moderationAction]],
                  (item) => item.push(commentId));
          break;
        case 'highlight':
          if (currentModeration === 'highlighted' && moderationAction === 'highlight') {
            break;
          }

          newState.articles = newState.articles
            .updateIn([ articleId, ACTION_PLURAL[moderationAction]],
                  (item) => item.push(commentId))
            .updateIn(['articles', articleId, 'approved'],
                  (item) => item.push(commentId));
          break;
        case 'reset':
          break;
        default:
          newState.articles
            .updateIn([articleId, ACTION_PLURAL[moderationAction]],
                (item) => item.push(commentId));
          break;
      }
    });

    return newState;
  },

  [setCommentsModerationForCategoriesAction.toString()]: (state, { payload }: Action<ISetCommentsModerationForCategoriesPayload>) => {
    const { category, commentIds, moderationAction, currentModeration } = payload;
    const newState = {...state};
    commentIds.forEach((commentId: string) => {
      const shouldRemoveFromList =
          currentModeration !== 'batched' &&
          currentModeration !== 'automated' &&
          ((currentModeration === 'highlighted' && moderationAction === 'highlight') ||
          (currentModeration !== 'highlighted' && moderationAction !== 'highlight'));

      if (shouldRemoveFromList) {
        newState.categories = newState.categories.updateIn([category.toString(), currentModeration],
            (moderated) => moderated.delete(moderated.findIndex((item: string) => item === commentId)));
      }
      switch (moderationAction) {
        case 'reject' || 'defer':
          newState.categories = newState.categories
            .updateIn([category, ACTION_PLURAL[moderationAction]],
                (item) => item.push(commentId));
          break;
        case 'highlight':
          if (currentModeration === 'highlighted' && moderationAction === 'highlight') {
            break;
          }

          newState.categories = newState.categories
            .updateIn([category, ACTION_PLURAL[moderationAction]],
                (item) => item.push(commentId))
            .updateIn([category, 'approved'],
                (item) => item.push(commentId));
          break;
        case 'reset':
          break;
        default:
          newState.categories = newState.categories
            .updateIn([category, ACTION_PLURAL[moderationAction]],
                (item) => item.push(commentId));
          break;
      }
    });

    return newState;
  },
}, initialState);

function getRecord(state: IAppStateRecord) {
  return state.getIn([...DATA_PREFIX, 'moderatedComments']) as IModeratedCommentsState;
}

export function getModeratedCommentsForArticle(state: IAppStateRecord): Map<string, Map<string, List<string>>> {
  const stateRecord = getRecord(state);
  return stateRecord && stateRecord.articles;
}

export function getModeratedCommentsForCategory(state: IAppStateRecord): Map<string, Map<string, List<string>>> {
  const stateRecord = getRecord(state);
  return stateRecord && stateRecord.categories;
}

export function getModeratedComments(state: IAppStateRecord, params: IModeratedCommentsPathParams): Map<string, List<string>> {
  if (isArticleContext(params)) {
    const articles = getModeratedCommentsForArticle(state);
    const articleId = params.contextId;
    if (articles && articles.has(articleId)) {
      return articles.get(articleId);
    }
  }
  else {
    const categories = getModeratedCommentsForCategory(state);
    const categoryId = params.contextId;
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
    batched: List<string>(),
    automated: List<string>(),
  });
}
