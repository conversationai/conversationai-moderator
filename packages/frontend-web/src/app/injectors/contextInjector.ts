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
import {connect} from 'react-redux';
import {RouteComponentProps} from 'react-router';

import {IArticleModel, ICategoryModel, ModelId} from '../../models';
import {IAppState} from '../appstate';
import {IContextPathParams, isArticleContext} from '../scenes/routes';
import {getCategory} from '../stores/categories';
import {getCachedArticle} from './fetchQueues';

export interface IContextInjectorProps {
  isArticleContext: boolean;
  categoryId: ModelId;
  category?: ICategoryModel;
  articleId?: ModelId;
  article?: IArticleModel;
  inCache: boolean;
}

function mapStateToProps(
  state: IAppState,
  {match: {params}}: RouteComponentProps<IContextPathParams>,
): IContextInjectorProps & {inCache: boolean} {
  if (!isArticleContext(params)) {
    return {
      isArticleContext: false,
      categoryId: params.contextId,
      category: getCategory(state, params.contextId),
      inCache: true,
    };
  }

  const articleId = params.contextId;
  const {article, inCache} = getCachedArticle(state, articleId);
  return {
    isArticleContext: true,
    categoryId: article.categoryId,
    category: getCategory(state, article.categoryId),
    articleId,
    article,
    inCache,
  };
}

export const contextInjector = connect(mapStateToProps);
