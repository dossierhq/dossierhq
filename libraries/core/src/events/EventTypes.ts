export const EventType = {
  // createEntity: 'createEntity',
  // createEntityAndPublish: 'createEntityAndPublish',
  // updateEntity: 'updateEntity',
  // updateEntityAndPublish: 'updateEntityAndPublish',
  // publishEntities: 'publishEntities',
  // unpublishEntities: 'unpublishEntities',
  // archiveEntity: 'archiveEntity',
  // unarchiveEntity: 'unarchiveEntity',
  updateSchema: 'updateSchema',
} as const;

interface Event<TEventType extends string> {
  type: TEventType;
  createdAt: Date;
  createdBy: string;
}

export type ChangelogQuery = {
  reverse?: boolean;
  createdBy?: string;
} & ({ schema: true } | object);

export type ChangelogEvent = SchemaChangelogEvent;

export interface SchemaChangelogEvent extends Event<typeof EventType.updateSchema> {
  version: number;
}
