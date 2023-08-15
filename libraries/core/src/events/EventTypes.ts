//TODO support all types

export const EventType = {
  createEntity: 'createEntity',
  createAndPublishEntity: 'createAndPublishEntity',
  updateEntity: 'updateEntity',
  updateAndPublishEntity: 'updateAndPublishEntity',
  // publishEntities: 'publishEntities',
  // unpublishEntities: 'unpublishEntities',
  // archiveEntity: 'archiveEntity',
  // unarchiveEntity: 'unarchiveEntity',
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
}

//TODO what to do if user aren't authorized to see the entity?
