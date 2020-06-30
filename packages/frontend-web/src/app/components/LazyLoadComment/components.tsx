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
import { Link } from 'react-router-dom';

import { OpenInNew } from '@material-ui/icons';

import { ModelId } from '../../../models';
import { useCachedArticle } from '../../injectors/articleInjector';
import { articleBase, NEW_COMMENTS_DEFAULT_TAG, newCommentsPageLink } from '../../scenes/routes';
import { ARTICLE_HEADLINE_TYPE } from '../../styles';
import { COMMON_STYLES } from '../../stylesx';
import { css } from '../../utilx';

export function ArticleTitle({articleId}: {articleId: ModelId}) {
  const {article} = useCachedArticle(articleId);
  return (
    <div key="title" style={{display: 'flex'}}>
      <Link
        key="text"
        {...css(COMMON_STYLES.articleLink)}
        to={newCommentsPageLink({
          context: articleBase,
          contextId: articleId,
          tag: NEW_COMMENTS_DEFAULT_TAG,
        })}
      >
        <h4 {...css(ARTICLE_HEADLINE_TYPE, { marginBottom: '0px', marginTop: '0px'  })}>
          {article?.title}
        </h4>
      </Link>
      {article?.url && (
        <div key="link" style={{display: 'inline-block', margin: '0 10px', position: 'relative', top: '3px'}}>
          <a href={article?.url} target="_blank" {...css(COMMON_STYLES.cellLink)}>
            <OpenInNew fontSize="small"/>
          </a>
        </div>
      )}
    </div>
  );
}
