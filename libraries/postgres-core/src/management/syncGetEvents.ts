import {
  EventType,
  notOk,
  ok,
  type SchemaSpecificationWithMigrations,
  type ArchiveEntitySyncEvent,
  type CreateEntitySyncEvent,
  type CreatePrincipalSyncEvent,
  type ErrorType,
  type PromiseResult,
  type PublishEntitiesSyncEvent,
  type Result,
  type SyncEvent,
  type UnarchiveEntitySyncEvent,
  type UnpublishEntitiesSyncEvent,
  type UpdateEntitySyncEvent,
  type UpdateSchemaSyncEvent,
} from '@dossierhq/core';
import {
  buildPostgresSqlQuery,
  type DatabaseManagementSyncGetEventsPayload,
  type DatabaseManagementSyncGetEventsQuery,
  type TransactionContext,
} from '@dossierhq/database-adapter';
import type {
  EntitiesTable,
  EntityVersionsTable,
  EventEntityVersionsTable,
  EventsTable,
  PrincipalsTable,
  SchemaVersionsTable,
  SubjectsTable,
} from '../DatabaseSchema.js';
import type { PostgresDatabaseAdapter } from '../PostgresDatabaseAdapter.js';
import { queryMany, queryNoneOrOne } from '../QueryFunctions.js';
import { assertExhaustive } from '../utils/AssertUtils.js';

export async function managementSyncGetEvents(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  query: DatabaseManagementSyncGetEventsQuery,
): PromiseResult<
  DatabaseManagementSyncGetEventsPayload,
  typeof ErrorType.BadRequest | typeof ErrorType.Generic
> {
  const nextIdResult = await resolveAfterId(database, context, query);
  if (nextIdResult.isError()) return nextIdResult;
  const afterId = nextIdResult.value;

  const eventRowsResult = await getEvents(database, context, query, afterId);
  if (eventRowsResult.isError()) return eventRowsResult;
  const { eventRows, hasMore } = eventRowsResult.value;

  const entitiesInfoResult = await getEntityInfoForEvents(database, context, eventRows);
  if (entitiesInfoResult.isError()) return entitiesInfoResult;

  const convertResult = convertEventRowsToPayload(eventRows, entitiesInfoResult.value, query.after);
  if (convertResult.isError()) return convertResult;

  return ok({ events: convertResult.value, hasMore });
}

async function resolveAfterId(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  query: DatabaseManagementSyncGetEventsQuery,
) {
  let afterId: number | null = null;

  if (query.after !== null) {
    const cursorResult = await queryNoneOrOne<Pick<EventsTable, 'id'>>(
      database,
      context,
      buildPostgresSqlQuery(({ sql }) => {
        sql`SELECT id FROM events WHERE uuid = ${query.after}`;
      }),
    );
    if (cursorResult.isError()) return cursorResult;
    afterId = cursorResult.value?.id ?? null;

    if (afterId === null) {
      return notOk.BadRequest(`No such event (${query.after})`);
    }
  }

  return ok(afterId);
}

type EventRow = Pick<EventsTable, 'id' | 'uuid' | 'type' | 'created_at'> & {
  created_by: SubjectsTable['uuid'];
} & Pick<SchemaVersionsTable, 'version' | 'specification'> &
  Pick<PrincipalsTable, 'provider' | 'identifier'>;

async function getEvents(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  query: DatabaseManagementSyncGetEventsQuery,
  afterId: number | null,
) {
  const result = await queryMany<EventRow>(
    database,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      sql`SELECT e.id, e.uuid, e.type, e.created_at, s.uuid AS created_by, sv.version, sv.specification, p.provider, p.identifier FROM events e`;
      sql`JOIN subjects s ON e.created_by = s.id`;
      sql`LEFT JOIN schema_versions sv ON e.schema_versions_id = sv.id`; // only available on schema events
      sql`LEFT JOIN principals p ON e.principals_id = p.id`; // only available on principal events
      if (afterId !== null) {
        sql`WHERE e.id > ${afterId}`;
      }
      sql`ORDER BY e.id ASC LIMIT ${query.limit + 1}`;
    }),
  );
  if (result.isError()) return result;
  const eventRows = result.value;

  const hasMore = eventRows.length > query.limit;
  eventRows.splice(query.limit);

  return ok({ eventRows, hasMore });
}

type EventEntityInfoPayload = Record<EventsTable['id'], EntityInfoPayload[]>;

type EntityInfoPayload = Pick<EventEntityVersionsTable, 'published_name'> &
  Pick<EntitiesTable, 'uuid' | 'auth_key' | 'resolved_auth_key'> &
  Pick<EntityVersionsTable, 'version'> &
  (Pick<EntityVersionsTable, 'name' | 'type' | 'schema_version' | 'data'> | object);

type CreateOrUpdateEntityInfoRow = Pick<EventEntityVersionsTable, 'events_id'> &
  Pick<EntityVersionsTable, 'name' | 'type' | 'schema_version' | 'data'> &
  Pick<EntitiesTable, 'uuid'>;

async function getEntityInfoForEvents(
  database: PostgresDatabaseAdapter,
  context: TransactionContext,
  eventRows: EventRow[],
): PromiseResult<EventEntityInfoPayload, typeof ErrorType.Generic> {
  const entityEventIds = eventRows
    .filter((it) => it.type !== EventType.updateSchema)
    .map((it) => it.id);

  if (entityEventIds.length === 0) {
    return ok([]);
  }

  // Get shared info that is needed by all entity events (the superset except what's needed only for create/update)
  const sharedResult = await queryMany<
    Pick<EventEntityVersionsTable, 'events_id' | 'published_name'> &
      Pick<EntitiesTable, 'uuid' | 'auth_key' | 'resolved_auth_key'> &
      Pick<EntityVersionsTable, 'version'>
  >(
    database,
    context,
    buildPostgresSqlQuery(({ sql }) => {
      sql`SELECT eev.events_id, eev.published_name, e.uuid, e.auth_key, e.resolved_auth_key, ev.version`;
      sql`FROM event_entity_versions eev`;
      sql`JOIN entity_versions ev ON eev.entity_versions_id = ev.id`;
      sql`JOIN entities e ON ev.entities_id = e.id`;
      sql`WHERE eev.events_id = ANY(${entityEventIds})`;
    }),
  );
  if (sharedResult.isError()) return sharedResult;
  const sharedRows = sharedResult.value;

  // Get the info that is only needed for create/update events (includes fields which can be heavy)
  const createOrUpdateEventIds = eventRows
    .filter(
      ({ type }) =>
        type === EventType.createEntity ||
        type === EventType.createAndPublishEntity ||
        type === EventType.updateEntity ||
        type === EventType.updateAndPublishEntity,
    )
    .map((it) => it.id);

  let createOrUpdateRows: CreateOrUpdateEntityInfoRow[] = [];
  if (createOrUpdateEventIds.length > 0) {
    const createOrUpdateResult = await queryMany<CreateOrUpdateEntityInfoRow>(
      database,
      context,
      buildPostgresSqlQuery(({ sql }) => {
        sql`SELECT eev.events_id, e.uuid, ev.name, ev.type, ev.schema_version, ev.data`;
        sql`FROM event_entity_versions eev`;
        sql`JOIN entity_versions ev ON eev.entity_versions_id = ev.id`;
        sql`JOIN entities e ON ev.entities_id = e.id`;
        sql`WHERE eev.events_id = ANY(${createOrUpdateEventIds})`;
      }),
    );
    if (createOrUpdateResult.isError()) return createOrUpdateResult;
    createOrUpdateRows = createOrUpdateResult.value;
  }

  // Merge all the entity info

  const payload: EventEntityInfoPayload = {};

  // For all events, we need the shared info for every entity
  for (const { events_id, ...rest } of sharedRows) {
    if (!payload[events_id]) {
      payload[events_id] = [];
    }
    payload[events_id].push(rest);
  }

  // For create/update events, we add the create/update info for every entity
  for (const { events_id, uuid, ...rest } of createOrUpdateRows) {
    const existingInfo = payload[events_id];
    const entityInfoIndex = existingInfo.findIndex((it) => it.uuid === uuid);
    existingInfo[entityInfoIndex] = { ...existingInfo[entityInfoIndex], ...rest };
  }

  return ok(payload);
}

function convertEventRowsToPayload(
  eventRows: EventRow[],
  entityInfo: EventEntityInfoPayload,
  previousId: string | null,
): Result<SyncEvent[], typeof ErrorType.Generic> {
  const events: SyncEvent[] = [];
  for (const eventRow of eventRows) {
    const { type } = eventRow;

    const parentId = previousId;
    previousId = eventRow.uuid;

    if (type === EventType.createPrincipal) {
      events.push(
        makeEvent<CreatePrincipalSyncEvent>(type, parentId, eventRow, {
          provider: eventRow.provider,
          identifier: eventRow.identifier,
        }),
      );
      continue;
    }
    if (type === EventType.updateSchema) {
      const schemaSpecification: SchemaSpecificationWithMigrations = {
        version: eventRow.version,
        ...eventRow.specification,
      };
      events.push(
        makeEvent<UpdateSchemaSyncEvent>(type, parentId, eventRow, { schemaSpecification }),
      );
      continue;
    }

    // The rest of the events need entity info

    const eventEntityInfo = entityInfo[eventRow.id];

    switch (type) {
      case EventType.archiveEntity: {
        const entityInfo = eventEntityInfo[0];
        events.push(
          makeEvent<ArchiveEntitySyncEvent>(type, parentId, eventRow, {
            entity: { id: entityInfo.uuid, version: entityInfo.version },
          }),
        );
        break;
      }
      case EventType.createEntity:
      case EventType.createAndPublishEntity: {
        const entityInfo = eventEntityInfo[0];
        if (!('data' in entityInfo)) {
          return notOk.Generic('Cannot find extended info about entity');
        }
        events.push(
          makeEvent<CreateEntitySyncEvent>(type, parentId, eventRow, {
            entity: {
              id: entityInfo.uuid,
              info: {
                type: entityInfo.type,
                name: entityInfo.name,
                authKey: entityInfo.auth_key,
                resolvedAuthKey: entityInfo.resolved_auth_key,
                schemaVersion: entityInfo.schema_version,
              },
              fields: entityInfo.data,
            },
          }),
        );
        break;
      }
      case EventType.publishEntities: {
        events.push(
          makeEvent<PublishEntitiesSyncEvent>(type, parentId, eventRow, {
            entities: eventEntityInfo.map((it) => ({
              id: it.uuid,
              version: it.version,
              publishedName: it.published_name!,
            })),
          }),
        );
        break;
      }
      case EventType.unarchiveEntity: {
        const entityInfo = eventEntityInfo[0];
        events.push(
          makeEvent<UnarchiveEntitySyncEvent>(type, parentId, eventRow, {
            entity: { id: entityInfo.uuid, version: entityInfo.version },
          }),
        );
        break;
      }
      case EventType.unpublishEntities: {
        events.push(
          makeEvent<UnpublishEntitiesSyncEvent>(type, parentId, eventRow, {
            entities: eventEntityInfo.map((it) => ({
              id: it.uuid,
              version: it.version,
            })),
          }),
        );
        break;
      }
      case EventType.updateEntity:
      case EventType.updateAndPublishEntity: {
        const entityInfo = eventEntityInfo[0];
        if (!('data' in entityInfo)) {
          return notOk.Generic('Cannot find extended info about entity');
        }
        events.push(
          makeEvent<UpdateEntitySyncEvent>(type, parentId, eventRow, {
            entity: {
              id: entityInfo.uuid,
              info: {
                name: entityInfo.name,
                version: entityInfo.version,
                schemaVersion: entityInfo.schema_version,
              },
              fields: entityInfo.data,
            },
          }),
        );
        break;
      }
      default:
        assertExhaustive(type);
    }
  }
  return ok(events);
}

function makeEvent<TEvent extends SyncEvent>(
  type: TEvent['type'],
  parentId: string | null,
  eventRow: EventRow,
  specific: Omit<TEvent, 'type' | 'id' | 'parentId' | 'createdAt' | 'createdBy'>,
) {
  return {
    id: eventRow.uuid,
    parentId,
    type,
    createdAt: eventRow.created_at,
    createdBy: eventRow.created_by,
    ...specific,
  } as TEvent;
}
