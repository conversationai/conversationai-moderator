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

export type IResourceID = string | number;

export interface IWithID {
  id: IResourceID;
}

export interface IResourceType {
  type: string;
}

export interface IResourceIdentifier extends IWithID, IResourceType {
}

export interface IAttributes {
  [name: string]: any;
}

export interface ILinks {
  [name: string]: string;
}

export interface IResourceSpecifics {
  attributes: IAttributes;
  relationships?: IRelationships;
  links?: ILinks;
}

export interface INewResource extends IResourceType, IResourceSpecifics {
}

export interface IResourceComplete extends IResourceIdentifier, IResourceSpecifics {
  [key: string]: any;
}

export type IResource = IResourceComplete | IResourceIdentifier;

export type IData = IResource | Array<IResource>; // Or empty array, null

export type IRelationship = IData;

export interface IEmbeddedRelationship {
  data: IRelationship;
  links: ILinks;
}

export interface IRelationships {
  [name: string]: IEmbeddedRelationship;
}

export interface IListDetails {
  totalItems: number;
  pageItems: Array<IResource>;
  includes?: Array<IResourceComplete>;
  extra?: any;
}

export interface IItemDetails {
  item: IResource;
  includes?: Array<IResourceComplete>;
}

export interface IPagingParams {
  limit?: number;
  offset?: number;
}

export interface IFilters {
  [key: string]: string | Array<string | number> | IFilters | boolean | number | null;
}

export interface IFields {
  [key: string]: Array<string>;
}

export interface IParams {
  page: IPagingParams;
  include: Array<string>;
  filters: IFilters;
  sort: Array<string>;
  fields: IFields;
}

export interface IStatusError {
  error: number;
  message?: string;
}
