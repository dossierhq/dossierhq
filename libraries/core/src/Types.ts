import type { Temporal } from '@js-temporal/polyfill';
import type { ErrorType, Result } from '.';

export interface Entity {
  id: string;
  info: EntityInfo;
  fields: Record<string, unknown>;
}

export interface EntityInfo {
  type: string;
  name: string;
}

export interface EntityReference {
  id: string;
}

export interface EntityVersionReference {
  id: string;
  version: number;
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
  type: string;
  [fieldName: string]: unknown;
}

export enum EntityPublishState {
  /** The entity has never been published. */
  Draft = 'draft',
  /** The entity is currently published and has no pending changes. */
  Published = 'published',
  /** The entity is currently published but has changes that are not published. */
  Modified = 'modified',
  /** The entity has previously been published, but is unpublished. */
  Withdrawn = 'withdrawn',
  /** The entity is archived. */
  Archived = 'archived',
}

export interface AdminEntity {
  id: string;
  info: AdminEntityInfo;
  fields: Record<string, unknown>;
}

export interface AdminEntityInfo {
  type: string;
  name: string;
  version: number;
  /** The current publish state of the entity.
   *
   * It is not connected to the requested version so if you get an old version of the entity, the
   * publish state refer to the state of the latest version. */
  publishingState: EntityPublishState;
  createdAt: Temporal.Instant;
  updatedAt: Temporal.Instant;
}

export interface AdminEntityCreate {
  /** UUID. If not provided a new id will be created */
  id?: string;
  info: {
    type: string;
    name: string;
    version?: 0;
  };
  fields: Record<string, unknown>;
}

export interface AdminEntityCreatePayload {
  effect: 'created' | 'none';
  entity: AdminEntity;
}

export interface AdminEntityUpdate {
  id: string;
  info?: {
    name?: string;
    /** If provided, has to be same as the entity's existing type, i.e. there's no way to change the type of an entity */
    type?: string;
    version?: number;
  };
  fields: Record<string, unknown>;
}

export interface AdminEntityUpdatePayload {
  effect: 'updated' | 'none';
  entity: AdminEntity;
}

export interface AdminEntityUpsert {
  id: string;
  info: {
    name: string;
    type: string;
  };
  fields: Record<string, unknown>;
}

export interface AdminEntityUpsertPayload {
  effect: 'created' | 'updated' | 'none';
  entity: AdminEntity;
}

export interface EntityHistory {
  id: string;
  versions: EntityVersionInfo[];
}

export interface EntityVersionInfo {
  version: number;
  published: boolean;
  createdBy: string;
  createdAt: Temporal.Instant;
}

export interface PublishingHistory {
  id: string;
  events: PublishingEvent[];
}

export enum PublishingEventKind {
  Publish = 'publish',
  Unpublish = 'unpublish',
  Archive = 'archive',
  Unarchive = 'unarchive',
}

export interface PublishingEvent {
  kind: PublishingEventKind;
  version: number | null;
  publishedAt: Temporal.Instant;
  publishedBy: string;
}

export enum AdminQueryOrder {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  name = 'name',
}

export interface AdminQuery {
  entityTypes?: string[];
  /** Entities referencing the entity (by id) */
  referencing?: string;
  boundingBox?: BoundingBox;
  order?: AdminQueryOrder;
  text?: string;
}

export interface Query {
  entityTypes?: string[];
  /** Entities referencing the entity (by id) */
  referencing?: string;
  boundingBox?: BoundingBox;
  order?: AdminQueryOrder;
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

export interface EntityPublishPayload {
  id: string;
  publishState: EntityPublishState;
  updatedAt: Temporal.Instant;
}
