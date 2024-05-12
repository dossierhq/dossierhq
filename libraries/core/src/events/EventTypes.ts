import type {
  LegacySchemaSpecificationWithMigrations,
  SchemaSpecificationWithMigrations,
} from '../schema/SchemaSpecification.js';
import type { EntityReference, EntityVersionReference } from '../Types.js';

export const EventType = {
  createPrincipal: 'createPrincipal',
  createEntity: 'createEntity',
  createAndPublishEntity: 'createAndPublishEntity',
  updateEntity: 'updateEntity',
  updateAndPublishEntity: 'updateAndPublishEntity',
  publishEntities: 'publishEntities',
  unpublishEntities: 'unpublishEntities',
  archiveEntity: 'archiveEntity',
  unarchiveEntity: 'unarchiveEntity',
  updateSchema: 'updateSchema',
} as const;

type EntityEventTypes = keyof Omit<typeof EventType, 'createPrincipal' | 'updateSchema'>;

interface EventShared<TEventType extends keyof typeof EventType> {
  id: string;
  type: TEventType;
  createdAt: Date;
  createdBy: string;
}

export interface ChangelogEventSharedQuery {
  createdBy?: string;
  entity?: EntityReference;
  types?: (keyof typeof EventType)[];
}

export interface ChangelogEventQuery extends ChangelogEventSharedQuery {
  reverse?: boolean;
}

export type ChangelogEvent =
  | CreatePrincipalChangelogEvent
  | SchemaChangelogEvent
  | EntityChangelogEvent;

export type CreatePrincipalChangelogEvent = EventShared<typeof EventType.createPrincipal>;

export interface SchemaChangelogEvent extends EventShared<typeof EventType.updateSchema> {
  version: number;
}

export interface EntityChangelogEvent<TEventType extends EntityEventTypes = EntityEventTypes>
  extends EventShared<TEventType> {
  entities: {
    id: string;
    version: number;
    type: string;
    name: string;
  }[];
  unauthorizedEntityCount: number;
}

//TODO how to handle deleted entities? include id and add a deleted flag?

export type SyncEvent =
  | CreatePrincipalSyncEvent
  | UpdateSchemaSyncEvent
  | CreateEntitySyncEvent
  | UpdateEntitySyncEvent
  | PublishEntitiesSyncEvent
  | UnpublishEntitiesSyncEvent
  | ArchiveEntitySyncEvent
  | UnarchiveEntitySyncEvent;

interface SyncEventShared<TEventType extends keyof typeof EventType>
  extends EventShared<TEventType> {
  parentId: string | null;
}

export interface CreatePrincipalSyncEvent
  extends SyncEventShared<typeof EventType.createPrincipal> {
  provider: string;
  identifier: string;
}

export interface UpdateSchemaSyncEvent extends SyncEventShared<typeof EventType.updateSchema> {
  schemaSpecification: SchemaSpecificationWithMigrations | LegacySchemaSpecificationWithMigrations;
}

export interface CreateEntitySyncEvent<
  TEventType extends typeof EventType.createEntity | typeof EventType.createAndPublishEntity =
    | typeof EventType.createEntity
    | typeof EventType.createAndPublishEntity,
> extends SyncEventShared<TEventType> {
  entity: {
    id: string;
    info: {
      type: string;
      name: string;
      authKey: string;
      resolvedAuthKey: string;
      schemaVersion: number;
    };
    fields: Record<string, unknown>;
  };
}

export interface UpdateEntitySyncEvent<
  TEventType extends typeof EventType.updateEntity | typeof EventType.updateAndPublishEntity =
    | typeof EventType.updateEntity
    | typeof EventType.updateAndPublishEntity,
> extends SyncEventShared<TEventType> {
  entity: {
    id: string;
    info: { name: string; version: number; schemaVersion: number };
    fields: Record<string, unknown>;
  };
}

export interface PublishEntitiesSyncEvent
  extends SyncEventShared<typeof EventType.publishEntities> {
  entities: {
    id: string;
    version: number;
    publishedName: string;
  }[];
}

export interface UnpublishEntitiesSyncEvent
  extends SyncEventShared<typeof EventType.unpublishEntities> {
  entities: EntityVersionReference[];
}

export interface ArchiveEntitySyncEvent extends SyncEventShared<typeof EventType.archiveEntity> {
  entity: EntityVersionReference;
}

export interface UnarchiveEntitySyncEvent
  extends SyncEventShared<typeof EventType.unarchiveEntity> {
  entity: EntityVersionReference;
}
