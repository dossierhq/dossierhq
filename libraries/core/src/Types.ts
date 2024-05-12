import type { ErrorType, Result } from './ErrorResult.js';
import type {
  SerializedCodeHighlightNode,
  SerializedCodeNode,
  SerializedDecoratorBlockNode,
  SerializedEditorState,
  SerializedElementNode,
  SerializedHeadingNode,
  SerializedLexicalNode,
  SerializedLineBreakNode,
  SerializedLinkNode,
  SerializedListItemNode,
  SerializedListNode,
  SerializedParagraphNode,
  SerializedRootNode,
  SerializedTabNode,
  SerializedTextNode,
  Spread,
} from './third-party/Lexical.js';

export interface PublishedEntity<
  TType extends string = string,
  TFields extends object = Record<string, unknown>,
  TAuthKey extends string = string,
> {
  /** UUID */
  id: string;
  info: PublishedEntityInfo<TType, TAuthKey>;
  fields: TFields;
}

export interface PublishedEntityInfo<
  TType extends string = string,
  TAuthKey extends string = string,
> {
  type: TType;
  name: string;
  authKey: TAuthKey;
  valid: boolean;
  createdAt: Date;
}

export interface EntityLike<
  TType extends string = string,
  TFields extends object = Record<string, unknown>,
> {
  id?: string;
  info: { type: TType };
  fields: TFields;
}

export interface EntityReference {
  id: string;
}

export interface EntityVersionReference {
  id: string;
  version: number;
}

export interface UniqueIndexReference<TIndex extends string = string> {
  index: TIndex;
  value: string;
}

export type RichText = SerializedEditorState;

export type RichTextNode = SerializedLexicalNode;

export type RichTextElementNode = SerializedElementNode;

export type RichTextTextNode = SerializedTextNode;

export type RichTextLineBreakNode = SerializedLineBreakNode;

export type RichTextTabNode = SerializedTabNode;

export type RichTextRootNode = SerializedRootNode;

export type RichTextParagraphNode = SerializedParagraphNode;

export type RichTextHeadingNode = SerializedHeadingNode;

export type RichTextLinkNode = SerializedLinkNode;

export type RichTextListNode = SerializedListNode;

export type RichTextListItemNode = SerializedListItemNode;

export type RichTextCodeNode = SerializedCodeNode;

export type RichTextCodeHighlightNode = SerializedCodeHighlightNode;

export type RichTextEntityNode = Spread<
  { reference: EntityReference },
  SerializedDecoratorBlockNode
>;

export type RichTextEntityLinkNode = Spread<{ reference: EntityReference }, RichTextElementNode>;

export type RichTextComponentNode = Spread<{ data: Component }, SerializedDecoratorBlockNode>;

export const RichTextNodeType = {
  code: 'code',
  'code-highlight': 'code-highlight',
  component: 'component',
  entity: 'entity',
  entityLink: 'entityLink',
  heading: 'heading',
  linebreak: 'linebreak',
  link: 'link',
  list: 'list',
  listitem: 'listitem',
  paragraph: 'paragraph',
  root: 'root',
  tab: 'tab',
  text: 'text',
} as const;
export type RichTextNodeType = (typeof RichTextNodeType)[keyof typeof RichTextNodeType];

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

export type Component<
  TType extends string = string,
  TFields extends object = Record<string, unknown>,
> = {
  type: TType;
} & TFields;

export const EntityStatus = {
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
export type EntityStatus = (typeof EntityStatus)[keyof typeof EntityStatus];

export interface Entity<
  TType extends string = string,
  TFields extends object = Record<string, unknown>,
  TAuthKey extends string = string,
> {
  /** UUID */
  id: string;
  info: EntityInfo<TType, TAuthKey>;
  fields: TFields;
}

export interface EntityInfo<TType extends string = string, TAuthKey extends string = string> {
  type: TType;
  name: string;
  version: number;
  authKey: TAuthKey;
  /** The current status of the entity.
   *
   * It is not connected to the requested version so if you get an old version of the entity, the
   * status refer to the latest version. */
  status: EntityStatus;
  /**
   * The current validation state of the entity. An invalid entity needs to be fixed before it can
   * be saved.
   *
   * It is not connected to the requested version so if you get an old version of the entity, the
   * validation state refers to the latest version. */
  valid: boolean;
  /**
   * The current validation state of the published entity.
   *
   * It is not connected to the requested version so if you get an old version of the entity.
   */
  validPublished: boolean | null;
  createdAt: Date;
  /**
   * The date when the entity was last updated. Could be due to creating or updating the entity, and
   * also when changing the status of the entity, by e.g. publishing it.
   *
   * When requesting a specific version of the entity, this date will be when the version was created.
   */
  updatedAt: Date;
}

export interface EntityMutationOptions {
  publish?: boolean;
}

export interface EntityCreate<T extends Entity<string, object> = Entity> {
  /** UUID. If not provided a new random id will be created */
  id?: string;
  info: {
    /** The entity type */
    type: T['info']['type'];
    /** The name of the entity.
     *
     * The name needs to be unique, so if it clashes with an existing entity a random suffix will be
     * appended to the name. */
    name?: string | null;
    version?: 1;
    authKey?: T['info']['authKey'] | null;
  };
  fields: Partial<T['fields']>;
}

export interface EntityCreatePayload<T extends Entity<string, object> = Entity> {
  effect: 'created' | 'createdAndPublished' | 'none';
  entity: T;
}

export interface EntityUpdate<T extends Entity<string, object> = Entity> {
  id: string;
  info?: {
    name?: string | null;
    /** If provided, has to be same as the entity's existing type, i.e. there's no way to change the type of an entity */
    type?: T['info']['type'];
    /** If provided, has to be the same as the existing version + 1 */
    version?: number;
    /** If provided, has to be the same as the existing authKey, i.e. there's no way to change the authKey of an entity */
    authKey?: T['info']['authKey'] | null;
  };
  fields: Partial<T['fields']>;
}

export interface EntityUpdatePayload<T extends Entity<string, object> = Entity> {
  effect: 'updated' | 'updatedAndPublished' | 'published' | 'none';
  entity: T;
}

export interface EntityUpsert<T extends Entity<string, object> = Entity> {
  id: string;
  info: {
    name?: string | null;
    type: T['info']['type'];
    authKey?: T['info']['authKey'] | null;
  };
  fields: Partial<T['fields']>;
}

export interface EntityUpsertPayload<T extends Entity<string, object> = Entity> {
  effect:
    | 'created'
    | 'createdAndPublished'
    | 'updated'
    | 'updatedAndPublished'
    | 'published'
    | 'none';
  entity: T;
}

export interface EntityPublishingPayload<TEffect> {
  id: string;
  status: EntityStatus;
  effect: TEffect;
  updatedAt: Date;
}

export type EntityArchivePayload = EntityPublishingPayload<'archived' | 'none'>;
export type EntityUnarchivePayload = EntityPublishingPayload<'unarchived' | 'none'>;
export type EntityPublishPayload = EntityPublishingPayload<'published' | 'none'>;
export type EntityUnpublishPayload = EntityPublishingPayload<'unpublished' | 'none'>;

export const EntityQueryOrder = {
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  name: 'name',
} as const;
export type EntityQueryOrder = keyof typeof EntityQueryOrder;

export interface EntitySharedQuery<
  TEntityType extends string = string,
  TComponentType extends string = string,
  TAuthKey extends string = string,
> {
  authKeys?: TAuthKey[];
  entityTypes?: TEntityType[];
  componentTypes?: TComponentType[];
  status?: EntityStatus[];
  valid?: boolean;
  linksTo?: EntityReference;
  linksFrom?: EntityReference;
  boundingBox?: BoundingBox;
  text?: string;
}

export interface EntityQuery<
  TEntityType extends string = string,
  TComponentType extends string = string,
  TAuthKey extends string = string,
> extends EntitySharedQuery<TEntityType, TComponentType, TAuthKey> {
  order?: EntityQueryOrder;
  reverse?: boolean;
}

export const PublishedEntityQueryOrder = {
  createdAt: 'createdAt',
  name: 'name',
} as const;
export type PublishedEntityQueryOrder =
  (typeof PublishedEntityQueryOrder)[keyof typeof PublishedEntityQueryOrder];

export interface PublishedEntitySharedQuery<
  TEntityType extends string = string,
  TComponentType extends string = string,
  TAuthKey extends string = string,
> {
  authKeys?: TAuthKey[];
  entityTypes?: TEntityType[];
  componentTypes?: TComponentType[];
  linksTo?: EntityReference;
  linksFrom?: EntityReference;
  boundingBox?: BoundingBox;
  text?: string;
}

export interface PublishedEntityQuery<
  TEntityType extends string = string,
  TComponentType extends string = string,
  TAuthKey extends string = string,
> extends PublishedEntitySharedQuery<TEntityType, TComponentType, TAuthKey> {
  order?: PublishedEntityQueryOrder;
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

export interface EntityProcessDirtyPayload {
  id: string;
  valid: boolean;
  validPublished: boolean | null;
  previousValid: boolean;
  previousValidPublished: boolean | null;
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
