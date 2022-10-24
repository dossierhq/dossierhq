import type { ErrorType, Result } from './ErrorResult.js';
import type { RichTextNodeType } from './Schema.js';
import type {
  SerializedDecoratorBlockNode,
  SerializedEditorState,
  SerializedElementNode,
  SerializedLexicalNode,
  SerializedTextNode,
  Spread,
} from './third-party/Lexical.js';

export interface PublishedEntity<
  TType extends string = string,
  TFields extends object = Record<string, unknown>
> {
  /** UUID */
  id: string;
  info: PublishedEntityInfo<TType>;
  fields: TFields;
}

export interface PublishedEntityInfo<TType extends string = string> {
  type: TType;
  name: string;
  authKey: string;
  createdAt: Date;
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

export interface EntityUniqueIndexReference {
  index: string;
  value: string;
}

export type RichText = SerializedEditorState;

export type RichTextNode = SerializedLexicalNode;

export type RichTextElementNode = SerializedElementNode;

export type RichTextTextNode = SerializedTextNode;

export type RichTextEntityNode = Spread<
  {
    type: typeof RichTextNodeType.entity;
    reference: EntityReference;
    version: 1;
  },
  SerializedDecoratorBlockNode
>;

export type RichTextEntityLinkNode = Spread<
  {
    type: typeof RichTextNodeType.entityLink;
    reference: EntityReference;
    version: 1;
  },
  RichTextElementNode
>;

export type RichTextValueItemNode = Spread<
  {
    type: typeof RichTextNodeType.valueItem;
    data: ValueItem;
    version: 1;
  },
  SerializedDecoratorBlockNode
>;

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

export type ValueItem<
  TType extends string = string,
  TFields extends object = Record<string, unknown>
> = {
  type: TType;
} & TFields;

export const AdminEntityStatus = {
  /** The entity has never been published. */
  draft: 'draft',
  /** The entity is currently published and has no pending changes. */
  published: 'published',
  /** The entity is currently published but has changes that are not published. */
  modified: 'modified',
  /** The entity has previously been published, but is unpublished. */
  withdrawn: 'withdrawn',
  /** The entity is archived. */
  archived: 'archived',
} as const;
export type AdminEntityStatus = keyof typeof AdminEntityStatus;

export interface AdminEntity<
  TType extends string = string,
  TFields extends object = Record<string, unknown>
> {
  /** UUID */
  id: string;
  info: AdminEntityInfo<TType>;
  fields: TFields;
}

export interface AdminEntityInfo<TType extends string = string> {
  type: TType;
  name: string;
  version: number;
  authKey: string;
  /** The current status of the entity.
   *
   * It is not connected to the requested version so if you get an old version of the entity, the
   * status refer to the latest version. */
  status: AdminEntityStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminEntityMutationOptions {
  publish?: boolean;
}

export interface AdminEntityCreate<T extends AdminEntity<string, object> = AdminEntity> {
  /** UUID. If not provided a new random id will be created */
  id?: string;
  info: {
    /** The entity type */
    type: T['info']['type'];
    /** The name of the entity.
     *
     * The name needs to be unique, so if it clashes with an existing entity a random suffix will be
     * appended to the name. */
    name: string;
    version?: 0;
    authKey: string;
  };
  fields: Partial<T['fields']>;
}

export interface AdminEntityCreatePayload<T extends AdminEntity<string, object> = AdminEntity> {
  effect: 'created' | 'createdAndPublished' | 'none';
  entity: T;
}

export interface AdminEntityUpdate<T extends AdminEntity<string, object> = AdminEntity> {
  id: string;
  info?: {
    name?: string;
    /** If provided, has to be same as the entity's existing type, i.e. there's no way to change the type of an entity */
    type?: T['info']['type'];
    version?: number;
    /** If provided, has to be the same as the existing authKey, i.e. there's no way to change the authKey of an entity */
    authKey?: string;
  };
  fields: Partial<T['fields']>;
}

export interface AdminEntityUpdatePayload<T extends AdminEntity<string, object> = AdminEntity> {
  effect: 'updated' | 'updatedAndPublished' | 'published' | 'none';
  entity: T;
}

export interface AdminEntityUpsert<T extends AdminEntity<string, object> = AdminEntity> {
  id: string;
  info: {
    name: string;
    type: T['info']['type'];
    authKey: string;
  };
  fields: Partial<T['fields']>;
}

export interface AdminEntityUpsertPayload<T extends AdminEntity<string, object> = AdminEntity> {
  effect:
    | 'created'
    | 'createdAndPublished'
    | 'updated'
    | 'updatedAndPublished'
    | 'published'
    | 'none';
  entity: T;
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

export const PublishingEventKind = {
  publish: 'publish',
  unpublish: 'unpublish',
  archive: 'archive',
  unarchive: 'unarchive',
} as const;
export type PublishingEventKind = keyof typeof PublishingEventKind;

export interface PublishingEvent {
  kind: PublishingEventKind;
  version: number | null;
  publishedAt: Date;
  publishedBy: string;
}

export interface AdminEntityPublishingPayload<TEffect> {
  id: string;
  status: AdminEntityStatus;
  effect: TEffect;
  updatedAt: Date;
}

export type AdminEntityArchivePayload = AdminEntityPublishingPayload<'archived' | 'none'>;
export type AdminEntityUnarchivePayload = AdminEntityPublishingPayload<'unarchived' | 'none'>;
export type AdminEntityPublishPayload = AdminEntityPublishingPayload<'published' | 'none'>;
export type AdminEntityUnpublishPayload = AdminEntityPublishingPayload<'unpublished' | 'none'>;

export const AdminQueryOrder = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  name: 'name',
} as const;
export type AdminQueryOrder = keyof typeof AdminQueryOrder;

export interface AdminQuery {
  authKeys?: string[];
  entityTypes?: string[];
  status?: AdminEntityStatus[];
  linksTo?: EntityReference;
  linksFrom?: EntityReference;
  boundingBox?: BoundingBox;
  text?: string;
}

export interface AdminSearchQuery extends AdminQuery {
  order?: AdminQueryOrder;
  reverse?: boolean;
}

export const PublishedQueryOrder = {
  createdAt: 'createdAt',
  name: 'name',
} as const;
export type PublishedQueryOrder = keyof typeof PublishedQueryOrder;

export interface PublishedQuery {
  authKeys?: string[];
  entityTypes?: string[];
  linksTo?: EntityReference;
  linksFrom?: EntityReference;
  boundingBox?: BoundingBox;
  text?: string;
}

export interface PublishedSearchQuery extends PublishedQuery {
  order?: PublishedQueryOrder;
  reverse?: boolean;
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

export interface AdvisoryLockOptions {
  leaseDuration: number;
}

export interface AdvisoryLockPayload {
  name: string;
  handle: number;
}

export interface AdvisoryLockReleasePayload {
  name: string;
}
