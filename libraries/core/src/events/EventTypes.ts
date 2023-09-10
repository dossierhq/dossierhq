import type { EntityReference, EntityVersionReference } from '../Types.js';
import type { AdminSchemaSpecificationWithMigrations } from '../schema/SchemaSpecification.js';

export const EventType = {
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

type EntityEventTypes = keyof Omit<typeof EventType, 'updateSchema'>;

interface EventShared<TEventType extends keyof typeof EventType> {
  id: string;
  type: TEventType;
  createdAt: Date;
  createdBy: string;
}

export interface ChangelogEventQuery {
  reverse?: boolean;
  createdBy?: string;
  entity?: EntityReference;
  types?: (keyof typeof EventType)[];
}

export type ChangelogEvent = SchemaChangelogEvent | EntityChangelogEvent;

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

export interface UpdateSchemaSyncEvent extends SyncEventShared<typeof EventType.updateSchema> {
  schemaSpecification: AdminSchemaSpecificationWithMigrations;
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
