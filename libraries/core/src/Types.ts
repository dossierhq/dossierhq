import type { Temporal } from '@js-temporal/polyfill';
import type { ErrorType, Result } from '.';

export interface PublishedEntity {
  id: string;
  info: PublishedEntityInfo;
  fields: Record<string, unknown>;
}

export interface PublishedEntityInfo {
  type: string;
  name: string;
  authKey: string;
  createdAt: Temporal.Instant;
}

export interface EntityLike {
  info: { type: string };
  fields: Record<string, unknown>;
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
  id?: string;
  type: Type;
  data: Data;
}

/** Geographic location using EPSG:4326/WGS 84 */
export interface Location {
  /** South/north -90°/90° */
  lat: number;
  /** West/east -180°/180° */
  lng: number;
}

/** Geographic bounding box using EPSG:4326/WGS 84 */
export interface BoundingBox {
  /** South/north -90°/90° */
  minLat: number;
  /** South/north -90°/90° */
  maxLat: number;
  /** West/east -180°/180° */
  minLng: number;
  /** West/east -180°/180° */
  maxLng: number;
}

export interface ValueItem {
  type: string;
  [fieldName: string]: unknown;
}

export enum AdminEntityStatus {
  /** The entity has never been published. */
  draft = 'draft',
  /** The entity is currently published and has no pending changes. */
  published = 'published',
  /** The entity is currently published but has changes that are not published. */
  modified = 'modified',
  /** The entity has previously been published, but is unpublished. */
  withdrawn = 'withdrawn',
  /** The entity is archived. */
  archived = 'archived',
}

export interface AdminEntity {
  /** UUID */
  id: string;
  info: AdminEntityInfo;
  fields: Record<string, unknown>;
}

export interface AdminEntityInfo {
  type: string;
  name: string;
  version: number;
  authKey: string;
  /** The current status of the entity.
   *
   * It is not connected to the requested version so if you get an old version of the entity, the
   * status refer to the latest version. */
  status: AdminEntityStatus;
  createdAt: Temporal.Instant;
  updatedAt: Temporal.Instant;
}

export interface AdminEntityMutationOptions {
  publish?: boolean;
}

export interface AdminEntityCreate {
  /** UUID. If not provided a new random id will be created */
  id?: string;
  info: {
    /** The entity type */
    type: string;
    /** The name of the entity.
     *
     * The name needs to be unique, so if it clashes with an existing entity a random suffix will be
     * appended to the name. */
    name: string;
    version?: 0;
    authKey: string;
  };
  fields: Record<string, unknown>;
}

export interface AdminEntityCreatePayload {
  effect: 'created' | 'createdAndPublished' | 'none';
  entity: AdminEntity;
}

export interface AdminEntityUpdate {
  id: string;
  info?: {
    name?: string;
    /** If provided, has to be same as the entity's existing type, i.e. there's no way to change the type of an entity */
    type?: string;
    version?: number;
    /** If provided, has to be the same as the existing authKey, i.e. there's no way to change the authKey of an entity */
    authKey?: string;
  };
  fields: Record<string, unknown>;
}

export interface AdminEntityUpdatePayload {
  effect: 'updated' | 'updatedAndPublished' | 'published' | 'none';
  entity: AdminEntity;
}

export interface AdminEntityUpsert {
  id: string;
  info: {
    name: string;
    type: string;
    authKey: string;
  };
  fields: Record<string, unknown>;
}

export interface AdminEntityUpsertPayload {
  effect:
    | 'created'
    | 'createdAndPublished'
    | 'updated'
    | 'updatedAndPublished'
    | 'published'
    | 'none';
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

export interface AdminEntityPublishingPayload<TEffect> {
  id: string;
  status: AdminEntityStatus;
  effect: TEffect;
  updatedAt: Temporal.Instant;
}

export type AdminEntityArchivePayload = AdminEntityPublishingPayload<'archived' | 'none'>;
export type AdminEntityUnarchivePayload = AdminEntityPublishingPayload<'unarchived' | 'none'>;
export type AdminEntityPublishPayload = AdminEntityPublishingPayload<'published' | 'none'>;
export type AdminEntityUnpublishPayload = AdminEntityPublishingPayload<'unpublished' | 'none'>;

export enum AdminQueryOrder {
  createdAt = 'createdAt',
  updatedAt = 'updatedAt',
  name = 'name',
}

export interface AdminQuery {
  authKeys?: string[];
  entityTypes?: string[];
  status?: AdminEntityStatus[];
  /** Entities referencing the entity (by id) */
  referencing?: string;
  boundingBox?: BoundingBox;
  order?: AdminQueryOrder;
  reverse?: boolean;
  text?: string;
}

export enum PublishedQueryOrder {
  createdAt = 'createdAt',
  name = 'name',
}

export interface PublishedQuery {
  authKeys?: string[];
  entityTypes?: string[];
  /** Entities referencing the entity (by id) */
  referencing?: string;
  boundingBox?: BoundingBox;
  order?: PublishedQueryOrder;
  reverse?: boolean;
  text?: string;
}

export interface EntitySamplingOptions {
  seed?: number;
  count?: number;
}

export interface EntitySamplingPayload<T> {
  seed: number;
  totalCount: number;
  items: T[];
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
