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

import { toIdentifier } from './shared';
import {
  IData,
  IItemDetails,
  IListDetails,
  IPagingParams,
  IResourceComplete,
} from './types';

export interface IError {
  status: string;
  title: string;
}

export interface IPagingMeta {
  offset: number;
  limit: number;
  total: number;
  links: {
    first: string;
    last: string;
    prev: string;
    next: string;
  };
}

export interface IMeta {
  page?: IPagingMeta;
  [key: string]: any;
}

export interface IDocumentExtras {
  errors?: Array<IError>;
  meta?: IMeta;
  included?: Array<IResourceComplete>;
}

export interface IDocument extends IDocumentExtras {
  jsonapi: {
    version: '1.0';
  };
  data: IData;
}

export interface IRendererResponse {
  data: IData;
  extra?: IDocumentExtras;
}

export type IRendererFunction = (data: any, paging?: IPagingParams, prefix?: string) => IRendererResponse;

export function renderDocument({ data, extra }: IRendererResponse): IDocument {
  return {
    jsonapi: {
      version: '1.0',
    },
    data,
    ...(extra || {}),
  } as IDocument;
}

export function renderItemResult(itemDetails: IItemDetails): IRendererResponse {
  return {
    data: itemDetails.item,
    extra: {
      ...(itemDetails.includes
          ? { included: itemDetails.includes }
          : {}),
    },
  };
}

export function renderListResults(
  listDetails: IListDetails,
  additionalMeta?: object,
): IRendererResponse {
  return {
    data: listDetails.pageItems,
    extra: {
      ...(listDetails.includes
          ? { included: listDetails.includes }
          : {}),
      ...(additionalMeta || {}),
    },
  };
}

export function renderRelationshipResult(
  details: IItemDetails | IListDetails,
): IRendererResponse {
  if ((details as any).item) {
    return renderItemResult(details as IItemDetails);
  } else {
    return renderListResults(details as IListDetails);
  }
}

export function renderListResultsAsIdentifiers(
  listDetails: IListDetails,
): IRendererResponse {
  return renderListResults({
    totalItems: listDetails.totalItems,
    pageItems: listDetails.pageItems.map(toIdentifier),
    includes: listDetails.includes,
  });
}
