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

interface Event<TEventType extends string> {
  type: TEventType;
  createdAt: Date;
  createdBy: string;
}

export type ChangelogQuery = {
  reverse?: boolean;
  createdBy?: string;
} & ({ schema: true } | object);

export type ChangelogEvent = SchemaChangelogEvent | EntityChangelogEvent;

export interface SchemaChangelogEvent extends Event<typeof EventType.updateSchema> {
  version: number;
}

export interface EntityChangelogEvent<TEventType extends EntityEventTypes = EntityEventTypes>
  extends Event<TEventType> {
  entities: {
    id: string;
    version: number;
    type: string;
    name: string;
  }[];
  unauthorizedEntityCount: number;
}

//TODO how to handle deleted entities? include id and add a deleted flag?
//TODO need to include the entity type in all events, or only in createEntity?
//TODO move original entity type from the event (in db) to the entity_versions table?
