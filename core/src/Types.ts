import type { ErrorType, Result } from '.';
import { ok } from './ErrorResult';

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
  _type: string;
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
  /** UUIDv4 */
  id: string;
  _name: string;
  _type: string;
  _version: number;

  /** The current publish state of the entity.
   *
   * It is not connected to the requested version so if you get an old version of the entity, the
   * publish state refer to the state of the latest version. */
  _publishState: EntityPublishState;
  [fieldName: string]: unknown;
}

//TODO temporary
export function toAdminEntity2(entity: AdminEntity): AdminEntity2 {
  const {
    id,
    _type: type,
    _name: name,
    _version: version,
    _publishState: publishingState,
    ...fields
  } = entity;
  return {
    id,
    info: { type, name, version, publishingState },
    fields,
  };
}

export function toAdminEntityResult2<TError extends ErrorType>(
  entity: Result<AdminEntity, TError>
): Result<AdminEntity2, TError> {
  if (entity.isError()) {
    return entity;
  }
  return ok(toAdminEntity2(entity.value));
}

//TODO temporary
export function toAdminEntity1(entity: AdminEntity2): AdminEntity {
  const {
    id,
    info: { name, type, version, publishingState },
    fields,
  } = entity;
  return {
    id,
    _name: name,
    _type: type,
    _version: version,
    _publishState: publishingState,
    ...fields,
  };
}

export interface AdminEntity2 {
  id: string;
  info: AdminEntityInfo;
  fields: Record<string, unknown>;
}

export interface AdminEntityInfo {
  type: string;
  name: string;
  version: number;
  publishingState: EntityPublishState;
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
  published: boolean;
  createdBy: string;
  createdAt: Date;
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

export interface PublishingResult {
  id: string;
  publishState: EntityPublishState;
}
