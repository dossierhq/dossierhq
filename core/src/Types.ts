import type { ErrorType, Result } from '.';

export interface Entity {
  id: string;
  _type: string;
  _name: string;
  [fieldName: string]: unknown;
}

export interface EntityReference {
  id: string;
}

export interface RichText {
  blocks: RichTextBlock[];
}

export interface RichTextBlock<Type extends string = string, Data = unknown> {
  type: Type;
  data: Data;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface BoundingBox {
  minLat: number;
  maxLat: number;
  minLng: number;
  maxLng: number;
}

export interface ValueItem {
  _type: string;
  [fieldName: string]: unknown;
}

export interface AdminEntity {
  /** UUIDv4 */
  id: string;
  _name: string;
  _type: string;
  _version: number;
  _deleted?: boolean;
  [fieldName: string]: unknown;
}

export interface AdminEntityCreate {
  /** UUIDv4. If not provided a new id will be created */
  id?: string;
  _name: string;
  _type: string;
  _version?: 0;
  [fieldName: string]: unknown;
}

export interface AdminEntityUpdate {
  /** UUIDv4 */
  id: string;
  _name?: string;
  /** If provided, has to be same as the entity's existing type, i.e. there's no way to change the type of an entity */
  _type?: string;
  _version?: number;
  [fieldName: string]: unknown;
}

export interface EntityHistory {
  id: string;
  versions: EntityVersionInfo[];
}

export interface EntityVersionInfo {
  version: number;
  deleted: boolean;
  published: boolean;
  createdBy: string;
  createdAt: Date;
}

export interface PublishHistory {
  id: string;
  events: PublishEvent[];
}

export interface PublishEvent {
  version: number | null;
  publishedAt: Date;
  publishedBy: string;
}

export interface AdminQuery {
  entityTypes?: string[];
  /** Entities referencing the entity (by id) */
  referencing?: string;
  boundingBox?: BoundingBox;
  /** Valid values: _name */
  order?: string;
  text?: string;
}

export interface Paging {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
}

export interface PageInfo {
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  startCursor: string;
  endCursor: string;
}

export interface Connection<T extends Edge<unknown, ErrorType>> {
  pageInfo: PageInfo;
  edges: T[];
}

export interface Edge<TOk, TError extends ErrorType> {
  node: Result<TOk, TError>;
  cursor: string;
}
